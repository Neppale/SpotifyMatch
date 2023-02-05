import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileParameters } from '../models/profile-parameters';
import { CompareProfilesById } from './useCases/compare-profiles-by-id';
import { FindPlaylistIdsByUserIdService } from '../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindPlaylistIdsByUserId } from '../../playlist/services/useCases/find-playlist-ids-by-user-id';
import { ProfileComparison, Verdict } from '../models/profile-comparison.model';
import { FindPlaylistTracksByIdService } from '../../playlist/services/find-playlist-tracks-by-id.service';
import { FindPlaylistTracksById } from '../../playlist/services/useCases/find-playlist-tracks-by-id';
import { ValidateSimilarTracks } from '../../tracks/services/useCases/validate-similar-tracks';
import { ValidateSimilarTracksService } from '../../tracks/services/validate-similar-tracks.service';
import { FindMinimizedTrackService } from '../../tracks/services/find-minimized-track.service';
import { FindMinimizedTrack } from '../../tracks/services/useCases/find-minimized-track';

@Injectable()
export class CompareProfilesByIdService implements CompareProfilesById {
  findPlaylistIdsByIdService: FindPlaylistIdsByUserId;
  findPlaylistTracksByIdService: FindPlaylistTracksById;
  validateSimilarTracksService: ValidateSimilarTracks;
  findMinimizedTrackService: FindMinimizedTrack;

  constructor(
    findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService,
    findPlaylistTracksByIdService: FindPlaylistTracksByIdService,
    validateSimilarTracksService: ValidateSimilarTracksService,
    findMinimizedTrackService: FindMinimizedTrackService,
  ) {
    this.findPlaylistIdsByIdService = findPlaylistIdsByIdService;
    this.findPlaylistTracksByIdService = findPlaylistTracksByIdService;
    this.validateSimilarTracksService = validateSimilarTracksService;
    this.findMinimizedTrackService = findMinimizedTrackService;
  }
  async compare({
    firstProfile,
    secondProfile,
    advanced,
  }: ProfileParameters): Promise<ProfileComparison> {
    if (!firstProfile || !secondProfile) {
      throw new BadRequestException('Missing profile id');
    }

    const [firstProfilePlaylistIds, secondProfilePlaylistIds] =
      await Promise.all([
        this.findPlaylistIdsByIdService.find(firstProfile),
        this.findPlaylistIdsByIdService.find(secondProfile),
      ]);

    const firstProfileTrackIds: string[] = [];
    for (const playlistId of firstProfilePlaylistIds) {
      const tracks = await this.findPlaylistTracksByIdService.find(playlistId);
      firstProfileTrackIds.push(...tracks);
    }
    firstProfilePlaylistIds.filter((track) => track);

    const secondProfileTrackIds: string[] = [];
    for (const playlistId of secondProfilePlaylistIds) {
      const tracks = await this.findPlaylistTracksByIdService.find(playlistId);
      secondProfileTrackIds.push(...tracks);
    }
    secondProfilePlaylistIds.filter((track) => track);

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
      ? await this.validateSimilarTracksService.validate(
          remainingFirstProfileTracks,
          remainingSecondProfileTracks,
        )
      : null;

    const percentage = Math.round(
      (sameTracks.size / firstProfileTrackIdsSet.size) * 100,
    );
    const verdict = getVerdict(percentage);
    const totalTracks =
      firstProfileTrackIdsSet.size +
      secondProfileTrackIdsSet.size -
      sameTracks.size;

    const matches: string[] = [];
    for (const track of sameTracks) {
      const minimizedTrack = await this.findMinimizedTrackService.find(track);
      matches.push(`${minimizedTrack.artist} - ${minimizedTrack.track}`);
    }

    const profileComparison: ProfileComparison = {
      percentage,
      verdict,
      matches,
      sameTracks: sameTracks.size,
      probableMatches,
      totalTracks,
    };

    return profileComparison;
  }
}

function getVerdict(percentage: number): Verdict {
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
