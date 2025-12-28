import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import { ProfileRepository } from '@Profile/services/profile.repository';
import { ProfileComparisonFormattedResponse } from '@Profile/models/profile-comparison.model';
import { Track, TrackVariant } from '@PrismaClient';
import { ProfilePlaylistData } from '@Profile/models/profile-playlist-data.model';
import { CompareProfileDto } from '@Profile/models/compare-profile.dto';
import { Response } from 'express';
import { TrackWithVariantId } from '@Tracks/models/track-with-variant-id.model';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly url = 'https://api.spotify.com/v1/users/';

  constructor(
    private readonly authService: AuthService,
    private readonly trackService: TrackService,
    private readonly profileRepository: ProfileRepository,
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
    { firstProfile, secondProfile }: CompareProfileDto,
    sessionId: string,
  ): Promise<void> {
    const [firstProfilePlaylists, secondProfilePlaylists] = await Promise.all([
      this.findPlaylists(firstProfile),
      this.findPlaylists(secondProfile),
    ]);

    const firstProfileSnapshotId = this.buildSnapshotId(
      firstProfilePlaylists
        .map((p) => p.snapshotId)
        .sort()
        .join('-'),
    );
    const secondProfileSnapshotId = this.buildSnapshotId(
      secondProfilePlaylists
        .map((p) => p.snapshotId)
        .sort()
        .join('-'),
    );

    const [firstProfileData, secondProfileData] = await Promise.all([
      this.profileRepository.findProfileWithLibrary(
        firstProfile,
        firstProfileSnapshotId,
      ),
      this.profileRepository.findProfileWithLibrary(
        secondProfile,
        secondProfileSnapshotId,
      ),
    ]);

    if (!firstProfileData || !secondProfileData) {
      const [firstProfileTrackIds, secondProfileTrackIds] = await Promise.all([
        this.trackService.getTrackIdsByPlaylistIds(
          firstProfilePlaylists.map((playlist) => playlist.playlistId),
        ),
        this.trackService.getTrackIdsByPlaylistIds(
          secondProfilePlaylists.map((playlist) => playlist.playlistId),
        ),
      ]);

      await this.sendProfileDataToProcess(sessionId, [
        {
          profileId: firstProfile,
          spotifyIds: firstProfileTrackIds,
          snapshotId: firstProfileSnapshotId,
        },
        {
          profileId: secondProfile,
          spotifyIds: secondProfileTrackIds,
          snapshotId: secondProfileSnapshotId,
        },
      ]);

      context.status(202).send({
        message:
          'Profiles are being processed. Please check the status endpoint.',
      });
      return;
    }
    const smallerProfileTracks =
      firstProfileData.tracks.length < secondProfileData.tracks.length
        ? firstProfileData.tracks
        : secondProfileData.tracks;
    const largerProfileTracks =
      firstProfileData.tracks.length < secondProfileData.tracks.length
        ? secondProfileData.tracks
        : firstProfileData.tracks;

    const sameTracks = new Map<
      string,
      {
        trackId: string;
        artist: string;
        artistId: string;
        title: string;
        album: string;
        releaseDate: string;
        durationMs: number;
        trackVariantId: string;
      }
    >();
    for (const track of smallerProfileTracks) {
      sameTracks.set(track.trackId, {
        ...track,
        trackVariantId: track.trackVariantId,
      });
    }
    for (const track of largerProfileTracks) {
      sameTracks.set(track.trackId, {
        ...track,
        trackVariantId: track.trackVariantId,
      });
    }

    // TODO: FIX THIS. IT SHOULD RETURN TRACKS THAT HAVE THE SAME TRACK BUT EACH A DIFFERENT VARIANT
    const similarTracks = this.filterSimilarTracks(
      smallerProfileTracks,
      largerProfileTracks,
      sameTracks,
    );
    const totalTracks =
      smallerProfileTracks.length +
      largerProfileTracks.length -
      sameTracks.size;
    const percentage =
      totalTracks === 0 ? 0 : Math.round((sameTracks.size / totalTracks) * 100);
    const formattedResponse: ProfileComparisonFormattedResponse = {
      message: this.buildMessage(percentage, totalTracks, sameTracks.size, 0),
      callToAction: this.buildCallToAction(),
      tracks: Array.from(sameTracks.values()),
      similarTracks,
    };

    context.status(200).send(formattedResponse);
  }

  private buildSnapshotId(snapshotIds: string): string {
    return crypto.createHash('md5').update(snapshotIds).digest('hex');
  }

  private filterSimilarTracks(
    smallerProfileTracks: TrackWithVariantId[],
    largerProfileTracks: TrackWithVariantId[],
    sameTracks: Map<string, TrackWithVariantId>,
  ): TrackWithVariantId[] {
    // TODO: FIX THIS. IT SHOULD CHECK IF THEY HAVE THE SAME TRACK BUT EACH A DIFFERENT VARIANT
    const similarTracks: TrackWithVariantId[] = [];
    for (const track of sameTracks.values()) {
      const trackVariants = [
        smallerProfileTracks.find((t) => t.trackId === track.trackId)
          ?.trackVariantId,
        largerProfileTracks.find((t) => t.trackId === track.trackId)
          ?.trackVariantId,
      ];
      if (this.areTrackVariantsDifferent(trackVariants))
        similarTracks.push({
          trackId: track.trackId,
          artist: track.artist,
          artistId: track.artistId,
          title: track.title,
          album: track.album,
          releaseDate: track.releaseDate,
          durationMs: track.durationMs,
          trackVariantId: track.trackVariantId,
        });
    }
    return similarTracks;
  }

  private areTrackVariantsDifferent(
    trackVariants: (string | undefined)[],
  ): boolean {
    return trackVariants.some(
      (variant, index) => variant !== trackVariants[index + 1],
    );
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
