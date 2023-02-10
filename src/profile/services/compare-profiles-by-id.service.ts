import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileParameters } from '../models/profile-parameters';
import { CompareProfilesById } from './useCases/compare-profiles-by-id';
import { FindPlaylistIdsByUserIdService } from '../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindPlaylistIdsByUserId } from '../../playlist/services/useCases/find-playlist-ids-by-user-id';
import { ProfileComparison, Verdict } from '../models/profile-comparison.model';
import { FindPlaylistTracksByIdService } from '../../playlist/services/find-playlist-tracks-by-id.service';
import { FindPlaylistTracksById } from '../../playlist/services/useCases/find-playlist-tracks-by-id';
import { FindSimilarTracks } from '../../tracks/services/useCases/find-similar-tracks';
import { FindSimilarTracksService } from '../../tracks/services/find-similar-tracks.service';
import { FindMinimizedTrackService } from '../../tracks/services/find-minimized-track.service';
import { FindMinimizedTrack } from '../../tracks/services/useCases/find-minimized-track';
import { ValidateProfileById } from './useCases/validate-profile-by-id';
import { ValidateProfileByIdService } from './validate-profile-by-id.service';
import { MinimizedTrack } from '../../tracks/models/minimized-track.model';

@Injectable()
export class CompareProfilesByIdService implements CompareProfilesById {
  findPlaylistIdsByIdService: FindPlaylistIdsByUserId;
  findPlaylistTracksByIdService: FindPlaylistTracksById;
  validateSimilarTracksService: FindSimilarTracks;
  findMinimizedTrackService: FindMinimizedTrack;
  validateProfileByIdService: ValidateProfileById;

  constructor(
    findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService,
    findPlaylistTracksByIdService: FindPlaylistTracksByIdService,
    validateSimilarTracksService: FindSimilarTracksService,
    findMinimizedTrackService: FindMinimizedTrackService,
    validateProfileByIdService: ValidateProfileByIdService,
  ) {
    this.findPlaylistIdsByIdService = findPlaylistIdsByIdService;
    this.findPlaylistTracksByIdService = findPlaylistTracksByIdService;
    this.validateSimilarTracksService = validateSimilarTracksService;
    this.findMinimizedTrackService = findMinimizedTrackService;
    this.validateProfileByIdService = validateProfileByIdService;
  }
  async compare({
    firstProfile,
    secondProfile,
    advanced,
  }: ProfileParameters): Promise<ProfileComparison> {
    if (!firstProfile || !secondProfile) {
      throw new BadRequestException('Missing profile id');
    }

    console.log(
      `Initializing comparison between ${firstProfile} and ${secondProfile}..`,
    );

    const [isFirstProfileValid, isSecondProfileValid] = await Promise.all([
      this.validateProfileByIdService.validate(firstProfile),
      this.validateProfileByIdService.validate(secondProfile),
    ]);
    if (!isFirstProfileValid) {
      throw new BadRequestException('First profile id is invalid');
    }
    if (!isSecondProfileValid) {
      throw new BadRequestException('Second profile id is invalid');
    }

    const [firstProfilePlaylistIds, secondProfilePlaylistIds] =
      await Promise.all([
        this.findPlaylistIdsByIdService.find(firstProfile),
        this.findPlaylistIdsByIdService.find(secondProfile),
      ]);

    const firstProfileTrackIds: string[] = [];
    const firstProfileTrackIdsPromises = [];
    for (const playlistId of firstProfilePlaylistIds) {
      const promise = this.findPlaylistTracksByIdService.find(playlistId);
      firstProfileTrackIdsPromises.push(promise);
    }
    const firstProfileTrackIdsResults = await Promise.all(
      firstProfileTrackIdsPromises,
    );
    firstProfileTrackIdsResults.forEach((currentResult) =>
      firstProfileTrackIds.push(...currentResult),
    );

    const secondProfileTrackIds: string[] = [];
    const secondProfileTrackIdsPromises = [];
    for (const playlistId of secondProfilePlaylistIds) {
      const promise = this.findPlaylistTracksByIdService.find(playlistId);
      secondProfileTrackIdsPromises.push(promise);
    }
    const secondProfileTrackIdsResults = await Promise.all(
      secondProfileTrackIdsPromises,
    );
    secondProfileTrackIdsResults.forEach((currentResult) =>
      secondProfileTrackIds.push(...currentResult),
    );

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
      ? await this.validateSimilarTracksService.find(
          remainingFirstProfileTracks,
          remainingSecondProfileTracks,
        )
      : undefined;

    const percentage = Math.round(
      (sameTracks.size /
        (firstProfileTrackIdsSet.size + secondProfileTrackIdsSet.size)) *
        100,
    );
    const verdict = getVerdict(percentage);
    const totalTracks =
      firstProfileTrackIdsSet.size +
      secondProfileTrackIdsSet.size -
      sameTracks.size;

    const matches: MinimizedTrack[] = [];
    const minizedTrackPromises = [];
    for (const track of sameTracks) {
      const promise = this.findMinimizedTrackService.find(track);
      minizedTrackPromises.push(promise);
    }
    const minimizedTracks = await Promise.all(minizedTrackPromises);
    matches.push(...minimizedTracks);

    const profileComparison: ProfileComparison = {
      percentage,
      verdict,
      matches,
      sameTracks: sameTracks.size,
      probableMatches,
      totalProbableMatches: probableMatches?.length,
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
