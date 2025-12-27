import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import { ProfileComparisonFormattedResponse } from '@Profile/models/profile-comparison.model';
import { Track } from 'generated/prisma';
import { ProfilePlaylistData } from '@Profile/models/profile-playlist-data.model';
import { CompareProfileDto } from '@Profile/models/compare-profile.dto';
import { Response } from 'express';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly url = 'https://api.spotify.com/v1/users/';

  constructor(
    private readonly authService: AuthService,
    private readonly trackService: TrackService,
    @InjectQueue('process_tracks') private readonly processTracksQueue: Queue,
  ) {}

  async findPlaylists(
    profileId: string,
  ): Promise<{ playlistId: string; snapshotId: string }[]> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${profileId}/playlists`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const playlistData: ProfilePlaylistData = response.data;
    if (!playlistData.items) return [];

    const playlists: { playlistId: string; snapshotId: string }[] =
      playlistData.items.map((item) => ({
        playlistId: item.id,
        snapshotId: item.snapshot_id,
      }));

    return playlists;
  }

  async validateProfile(profileId: string): Promise<void> {
    try {
      await this.authService.requestWithAuth(async (token) => {
        return await axios.get(`${this.url}${profileId}`, {
          headers: {
            Authorization: token,
          },
        });
      });
    } catch (error) {
      throw new BadRequestException(`Invalid profile ID: ${profileId}`);
    }
  }

  async compareProfiles(
    context: Response,
    { firstProfile, secondProfile, advanced, saveResults }: CompareProfileDto,
    sessionId: string,
  ): Promise<void> {
    const [firstProfilePlaylistIds, secondProfilePlaylistIds] =
      await Promise.all([
        this.findPlaylists(firstProfile),
        this.findPlaylists(secondProfile),
      ]);

    const [firstProfileTrackIds, secondProfileTrackIds] = await Promise.all([
      this.trackService.getTrackIdsByPlaylistIds(
        firstProfilePlaylistIds.map((playlist) => playlist.playlistId),
      ),
      this.trackService.getTrackIdsByPlaylistIds(
        secondProfilePlaylistIds.map((playlist) => playlist.playlistId),
      ),
    ]);

    if (saveResults) {
      await this.sendProfileDataToProcess(sessionId, [
        {
          profileId: firstProfile,
          spotifyIds: firstProfileTrackIds,
          snapshotId: firstProfilePlaylistIds
            .map((p) => p.snapshotId)
            .sort()
            .join('-'),
        },
        {
          profileId: secondProfile,
          spotifyIds: secondProfileTrackIds,
          snapshotId: secondProfilePlaylistIds
            .map((p) => p.snapshotId)
            .sort()
            .join('-'),
        },
      ]);
    }

    const [firstProfileTrackIdsSet, secondProfileTrackIdsSet] = [
      new Set(firstProfileTrackIds),
      new Set(secondProfileTrackIds),
    ];

    const sameTracks = new Set<string>();
    const smallerSet =
      firstProfileTrackIdsSet.size <= secondProfileTrackIdsSet.size
        ? firstProfileTrackIdsSet
        : secondProfileTrackIdsSet;
    const largerSet =
      smallerSet === firstProfileTrackIdsSet
        ? secondProfileTrackIdsSet
        : firstProfileTrackIdsSet;
    for (const track of smallerSet) {
      if (largerSet.has(track)) {
        sameTracks.add(track);
      }
    }

    const remainingFirstProfileTracks = [...firstProfileTrackIdsSet].filter(
      (currentTrack) => !sameTracks.has(currentTrack),
    );
    const remainingSecondProfileTracks = [...secondProfileTrackIdsSet].filter(
      (currentTrack) => !sameTracks.has(currentTrack),
    );

    const similarTracks = advanced
      ? await this.trackService.getSimilarTracksWithoutDB(
          remainingFirstProfileTracks,
          remainingSecondProfileTracks,
        )
      : undefined;

    const totalTracks =
      firstProfileTrackIdsSet.size +
      secondProfileTrackIdsSet.size -
      sameTracks.size;
    const percentage =
      totalTracks === 0
        ? 0
        : Math.round(
            ((sameTracks.size + (similarTracks?.length || 0)) / totalTracks) *
              100,
          );

    const matches: Track[] = [];
    const trackPromises = [];
    for (const track of sameTracks) {
      const promise = this.trackService.getTrack(track);
      trackPromises.push(promise);
    }
    const tracks = await Promise.all(trackPromises);
    matches.push(...tracks);

    const formattedResponse: ProfileComparisonFormattedResponse = {
      message: this.buildMessage(
        percentage,
        totalTracks,
        matches.length,
        similarTracks?.length,
      ),
      callToAction: this.buildCallToAction(),
      similarTracks,
      exactTracks: matches,
    };

    this.logger.log(
      `Profiles ${firstProfile} and ${secondProfile} have a ${percentage}% match with ${
        sameTracks.size
      } same tracks and ${similarTracks?.length || 0} probable matches`,
    );

    context.status(200).send(formattedResponse);
  }

  private buildMessage(
    percentage: number,
    totalTracks: number,
    exactTracks: number,
    similarTracks: number,
  ): string {
    const reactionMessage = this.getReactionMessage(percentage);
    const analysisMessage = `I analyzed ${totalTracks} tracks and found ${exactTracks} exact matches and ${similarTracks} probable matches between you two!`;
    return `${reactionMessage}\n${analysisMessage}`;
  }

  private getReactionMessage(percentage: number): string {
    // TODO: Build this later to gather AI generated reaction messages based on the most popular song they have in common. Just for funsies :)
    switch (percentage) {
      case 100:
        return 'You only listen to the same tracks! You are a perfect match!';
      case 80:
        return 'You gotta feel that heat, baby! Here are your results:';
      case 50:
        return 'You have some stuff in common, but are pretty different overall. Here are your results:';
      default:
        return 'Yeah, I think this one is a no-go. Sorry about that, but here are your results:';
    }
  }

  private buildCallToAction(): string {
    // TODO: Build this later to gather AI generated call to action messages based on the most popular song they have in common. Just for funsies :)
    return "...you're not even that into each other anyway, right? Wanna try again?";
  }

  async sendProfileDataToProcess(
    sessionId: string,
    profiles: {
      spotifyIds: string[];
      snapshotId: string;
      profileId: string;
    }[],
  ): Promise<void> {
    await this.processTracksQueue.add('process_profiles', {
      sessionId,
      profiles,
    });

    this.logger.log(
      `Sent ${profiles.length} profile(s) to process_tracks queue for session ${sessionId}`,
    );
  }
}
