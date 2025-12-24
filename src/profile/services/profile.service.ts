import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { FindPlaylistIdsByUserIdService } from '@Playlist/services/find-playlist-ids-by-user-id.service';
import { FindPlaylistIdsByUserId } from '@Playlist/services/useCases/find-playlist-ids-by-user-id';
import { FindTrackIdsByPlaylistIdsService } from '@Playlist/services/find-track-ids-by-playlist-ids.service';
import { FindTrackIdsByPlaylistIds } from '@Playlist/services/useCases/find-track-ids-by-playlist-ids';
import { TrackService } from '@Tracks/services/track.service';
import {
  ProfileComparison,
  Verdict,
} from '@Profile/models/profile-comparison.model';
import { Track } from '@prisma/client';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly url = 'https://api.spotify.com/v1/users/';
  private readonly findPlaylistIdsByIdService: FindPlaylistIdsByUserId;
  private readonly findTrackIdsByPlaylistIdsService: FindTrackIdsByPlaylistIds;
  private readonly trackService: TrackService;

  constructor(
    private readonly authService: AuthService,
    findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService,
    findTrackIdsByPlaylistIdsService: FindTrackIdsByPlaylistIdsService,
    trackService: TrackService,
  ) {
    this.findPlaylistIdsByIdService = findPlaylistIdsByIdService;
    this.findTrackIdsByPlaylistIdsService = findTrackIdsByPlaylistIdsService;
    this.trackService = trackService;
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
    firstProfileId: string,
    secondProfileId: string,
    advanced = false,
  ): Promise<ProfileComparison> {
    if (!firstProfileId || !secondProfileId) {
      throw new BadRequestException('Missing profile id');
    }

    await Promise.all([
      this.validateProfile(firstProfileId),
      this.validateProfile(secondProfileId),
    ]);

    this.logger.log(
      `Comparing profiles: ${firstProfileId} and ${secondProfileId} with advanced parameter set to ${advanced}`,
    );

    const [firstProfilePlaylistIds, secondProfilePlaylistIds] =
      await Promise.all([
        this.findPlaylistIdsByIdService.find(firstProfileId),
        this.findPlaylistIdsByIdService.find(secondProfileId),
      ]);

    const [firstProfileTrackIds, secondProfileTrackIds] = await Promise.all([
      this.findTrackIdsByPlaylistIdsService.find(firstProfilePlaylistIds),
      this.findTrackIdsByPlaylistIdsService.find(secondProfilePlaylistIds),
    ]);

    const [firstProfileTrackIdsSet, secondProfileTrackIdsSet] = [
      new Set(firstProfileTrackIds),
      new Set(secondProfileTrackIds),
    ];

    const sameTracks = new Set(
      [...firstProfileTrackIdsSet].filter((currentTrack) =>
        secondProfileTrackIdsSet.has(currentTrack),
      ),
    );

    const remainingFirstProfileTracks = [...firstProfileTrackIdsSet].filter(
      (currentTrack) => !sameTracks.has(currentTrack),
    );

    const remainingSecondProfileTracks = [...secondProfileTrackIdsSet].filter(
      (currentTrack) => !sameTracks.has(currentTrack),
    );

    const probableMatches = advanced
      ? await this.trackService.getSimilarTracks(
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
            ((sameTracks.size + (probableMatches?.length || 0)) / totalTracks) *
              100,
          );

    const verdict = this.getVerdict(percentage);

    const matches: Track[] = [];
    const trackPromises = [];
    for (const track of sameTracks) {
      const promise = this.trackService.getTrack(track);
      trackPromises.push(promise);
    }
    const tracks = await Promise.all(trackPromises);
    matches.push(...tracks);

    const profileComparison: ProfileComparison = {
      percentage,
      verdict,
      matches,
      sameTracks: sameTracks.size,
      probableMatches,
      totalProbableMatches: probableMatches?.length,
      totalTracks,
    };

    this.logger.log(
      `Profiles ${firstProfileId} and ${secondProfileId} have a ${percentage}% match with ${
        sameTracks.size
      } same tracks and ${probableMatches?.length || 0} probable matches`,
    );

    return profileComparison;
  }

  private getVerdict(percentage: number): Verdict {
    if (percentage === 100) {
      return Verdict.PERFECT_MATCH;
    }
    if (percentage > 80) {
      return Verdict.GOOD_MATCH;
    }
    if (percentage > 50) {
      return Verdict.BAD_MATCH;
    }
    return Verdict.NO_MATCH;
  }
}
