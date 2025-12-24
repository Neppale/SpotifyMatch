import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import {
  ProfileComparison,
  Verdict,
} from '@Profile/models/profile-comparison.model';
import { Track } from '@prisma/client';
import { ProfilePlaylistData } from '@Profile/models/profile-playlist-data.model';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly url = 'https://api.spotify.com/v1/users/';
  private readonly trackService: TrackService;

  constructor(
    private readonly authService: AuthService,
    trackService: TrackService,
  ) {
    this.trackService = trackService;
  }

  async findPlaylists(profileId: string): Promise<string[]> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${profileId}/playlists`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const playlistData: ProfilePlaylistData = response.data;
    if (!playlistData.items) return [];

    const playlistHrefs: string[] = playlistData.items.map(
      (item) => item.tracks.href,
    );

    playlistHrefs.forEach((href, index) => {
      playlistHrefs[index] = href.replace(
        'https://api.spotify.com/v1/playlists/',
        '',
      );
      playlistHrefs[index] = playlistHrefs[index].replace('/tracks', '');
    });

    return playlistHrefs;
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
        this.findPlaylists(firstProfileId),
        this.findPlaylists(secondProfileId),
      ]);

    const [firstProfileTrackIds, secondProfileTrackIds] = await Promise.all([
      this.trackService.getTrackIdsByPlaylistIds(firstProfilePlaylistIds),
      this.trackService.getTrackIdsByPlaylistIds(secondProfilePlaylistIds),
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
