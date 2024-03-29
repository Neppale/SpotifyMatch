import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProfileParameters } from '../models/profile.parameters';
import { CompareProfilesById } from './useCases/compare-profiles-by-id';
import { FindPlaylistIdsByUserIdService } from '../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindPlaylistIdsByUserId } from '../../playlist/services/useCases/find-playlist-ids-by-user-id';
import { ProfileComparison, Verdict } from '../models/profile-comparison.model';
import { FindTrackIdsByPlaylistIdsService } from '../../playlist/services/find-track-ids-by-playlist-ids.service';
import { FindTrackIdsByPlaylistIds } from '../../playlist/services/useCases/find-track-ids-by-playlist-ids';
import { FindSimilarTracks } from '../../tracks/services/useCases/find-similar-tracks';
import { FindSimilarTracksService } from '../../tracks/services/find-similar-tracks.service';
import { FindMinimizedTrackService } from '../../tracks/services/find-minimized-track.service';
import { FindMinimizedTrack } from '../../tracks/services/useCases/find-minimized-track';
import { ValidateProfileById } from './useCases/validate-profile-by-id';
import { ValidateProfileByIdService } from './validate-profile-by-id.service';
import { MinimizedTrack } from '../../tracks/models/minimized-track.model';

@Injectable()
export class CompareProfilesByIdService implements CompareProfilesById {
  logger: Logger = new Logger(CompareProfilesByIdService.name);
  findPlaylistIdsByIdService: FindPlaylistIdsByUserId;
  findTrackIdsByPlaylistIdsService: FindTrackIdsByPlaylistIds;
  findSimilarTracksService: FindSimilarTracks;
  findMinimizedTrackService: FindMinimizedTrack;
  validateProfileByIdService: ValidateProfileById;

  constructor(
    findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService,
    findTrackIdsByPlaylistIdsService: FindTrackIdsByPlaylistIdsService,
    findSimilarTracksService: FindSimilarTracksService,
    findMinimizedTrackService: FindMinimizedTrackService,
    validateProfileByIdService: ValidateProfileByIdService,
  ) {
    this.findPlaylistIdsByIdService = findPlaylistIdsByIdService;
    this.findTrackIdsByPlaylistIdsService = findTrackIdsByPlaylistIdsService;
    this.findSimilarTracksService = findSimilarTracksService;
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

    await Promise.all([
      this.validateProfileByIdService.validate(firstProfile),
      this.validateProfileByIdService.validate(secondProfile),
    ]);

    this.logger.log(
      `Comparing profiles: ${firstProfile} and ${secondProfile} with advanced parameter set to ${advanced}`,
    );

    const [firstProfilePlaylistIds, secondProfilePlaylistIds] =
      await Promise.all([
        this.findPlaylistIdsByIdService.find(firstProfile),
        this.findPlaylistIdsByIdService.find(secondProfile),
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
      ? await this.findSimilarTracksService.find(
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

    const verdict = getVerdict(percentage);

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

    this.logger.log(
      `Profiles ${firstProfile} and ${secondProfile} have a ${percentage}% match with ${
        sameTracks.size
      } same tracks and ${probableMatches?.length || 0} probable matches`,
    );

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
