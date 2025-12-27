import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import { ProfileRepository } from '@Profile/services/profile.repository';
import { ProfileComparisonFormattedResponse } from '@Profile/models/profile-comparison.model';
import { Track } from '@PrismaClient';
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
    { firstProfile, secondProfile, advanced }: CompareProfileDto,
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

    const firstProfileTracks = firstProfileData.ProfileLibrary.map(
      (lib) => lib.trackVariant.Track,
    );
    const secondProfileTracks = secondProfileData.ProfileLibrary.map(
      (lib) => lib.trackVariant.Track,
    );

    const firstProfileTracksSet = new Set(firstProfileTracks.map((t) => t.id));
    const secondProfileTracksSet = new Set(
      secondProfileTracks.map((t) => t.id),
    );

    const sameTracks: Track[] = [];
    const smallerSet =
      firstProfileTracksSet.size <= secondProfileTracksSet.size
        ? firstProfileTracksSet
        : secondProfileTracksSet;
    const largerTracksMap = new Map<string, Track>();
    if (smallerSet === firstProfileTracksSet) {
      secondProfileTracks.forEach((t) => largerTracksMap.set(t.id, t));
      firstProfileTracks.forEach((t) => {
        if (largerTracksMap.has(t.id)) {
          sameTracks.push(t);
        }
      });
    } else {
      firstProfileTracks.forEach((t) => largerTracksMap.set(t.id, t));
      secondProfileTracks.forEach((t) => {
        if (largerTracksMap.has(t.id)) {
          sameTracks.push(t);
        }
      });
    }

    const remainingFirstProfileTracks = firstProfileTracks.filter(
      (t) => !secondProfileTracksSet.has(t.id),
    );
    const remainingSecondProfileTracks = secondProfileTracks.filter(
      (t) => !firstProfileTracksSet.has(t.id),
    );

    const similarTracks = advanced
      ? await this.compareTracksFromDB(
          remainingFirstProfileTracks,
          remainingSecondProfileTracks,
        )
      : undefined;

    const totalTracks =
      firstProfileTracks.length +
      secondProfileTracks.length -
      sameTracks.length;
    const percentage =
      totalTracks === 0
        ? 0
        : Math.round(
            ((sameTracks.length + (similarTracks?.length || 0)) / totalTracks) *
              100,
          );

    const formattedResponse: ProfileComparisonFormattedResponse = {
      message: this.buildMessage(
        percentage,
        totalTracks,
        sameTracks.length,
        similarTracks?.length,
      ),
      callToAction: this.buildCallToAction(),
      similarTracks: similarTracks || [],
      exactTracks: sameTracks,
    };

    this.logger.log(
      `Profiles ${firstProfile} and ${secondProfile} have a ${percentage}% match with ${
        sameTracks.length
      } same tracks and ${similarTracks?.length || 0} probable matches`,
    );

    context.status(200).send(formattedResponse);
  }

  private buildSnapshotId(snapshotIds: string): string {
    return crypto.createHash('md5').update(snapshotIds).digest('hex');
  }

  private async compareTracksFromDB(
    firstProfileTracks: Track[],
    secondProfileTracks: Track[],
  ): Promise<Track[]> {
    const firstProfileArtistTracks = new Map<string, Track[]>();
    for (const track of firstProfileTracks) {
      const existing = firstProfileArtistTracks.get(track.artist);
      if (existing) {
        existing.push(track);
      } else {
        firstProfileArtistTracks.set(track.artist, [track]);
      }
    }

    const secondProfileArtistTracks = new Map<string, Track[]>();
    for (const track of secondProfileTracks) {
      const existing = secondProfileArtistTracks.get(track.artist);
      if (existing) {
        existing.push(track);
      } else {
        secondProfileArtistTracks.set(track.artist, [track]);
      }
    }

    const similarTracks: Track[] = [];
    const similarTrackIds = new Set<string>();
    const profileWithLeastTracks =
      firstProfileArtistTracks.size < secondProfileArtistTracks.size
        ? firstProfileArtistTracks
        : secondProfileArtistTracks;

    const profileWithMostTracks =
      firstProfileArtistTracks.size > secondProfileArtistTracks.size
        ? firstProfileArtistTracks
        : secondProfileArtistTracks;

    for (const [
      artistName,
      tracksFromSmallerProfile,
    ] of profileWithLeastTracks) {
      const tracksFromLargerProfile = profileWithMostTracks.get(artistName);
      if (tracksFromLargerProfile) {
        for (const firstTrack of tracksFromSmallerProfile) {
          const trackKey = firstTrack.id;
          if (similarTrackIds.has(trackKey)) {
            continue;
          }
          for (const secondTrack of tracksFromLargerProfile) {
            if (this.compareTracksWithoutDB(firstTrack, secondTrack)) {
              if (!similarTrackIds.has(trackKey)) {
                similarTrackIds.add(trackKey);
                similarTracks.push(firstTrack);
              }
              break;
            }
          }
        }
      }
    }

    return similarTracks;
  }

  private compareTracksWithoutDB(
    firstTrack: {
      artist: string;
      title: string;
      album: string;
      releaseDate: string;
      durationMs: number;
    },
    secondTrack: {
      artist: string;
      title: string;
      album: string;
      releaseDate: string;
      durationMs: number;
    },
  ): boolean {
    const SCORE_THRESHOLD = 3;
    let score = 0;
    if (firstTrack.artist === secondTrack.artist) score++;
    if (firstTrack.title === secondTrack.title) score++;
    if (firstTrack.album === secondTrack.album) score++;
    if (firstTrack.releaseDate === secondTrack.releaseDate) score++;
    if (firstTrack.durationMs === secondTrack.durationMs) score++;

    return score >= SCORE_THRESHOLD;
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
