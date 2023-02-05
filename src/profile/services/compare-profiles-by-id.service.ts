import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileParameters } from '../models/profile-parameters';
import { CompareProfilesById } from './useCases/compare-profiles-by-id';
import { FindPlaylistIdsByUserIdService } from '../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindPlaylistIdsByUserId } from '../../playlist/services/useCases/find-playlist-ids-by-user-id';
import { ProfileComparison, Verdict } from '../models/profile-comparison.model';
import { FindPlaylistTracksByIdService } from 'src/playlist/services/find-playlist-tracks-by-id.service';
import { FindPlaylistTracksById } from 'src/playlist/services/useCases/find-playlist-tracks-by-id';

@Injectable()
export class CompareProfilesByIdService implements CompareProfilesById {
  findPlaylistIdsByIdService: FindPlaylistIdsByUserId;
  findPlaylistTracksByIdService: FindPlaylistTracksById;

  constructor(
    findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService,
    findPlaylistTracksByIdService: FindPlaylistTracksByIdService,
  ) {
    this.findPlaylistIdsByIdService = findPlaylistIdsByIdService;
    this.findPlaylistTracksByIdService = findPlaylistTracksByIdService;
  }
  async compare({
    firstProfile,
    secondProfile,
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

    const secondProfileTrackIds: string[] = [];
    for (const playlistId of secondProfilePlaylistIds) {
      const tracks = await this.findPlaylistTracksByIdService.find(playlistId);
      secondProfileTrackIds.push(...tracks);
    }

    const [firstProfileTrackIdsSet, secondProfileTrackIdsSet] = [
      new Set(firstProfileTrackIds),
      new Set(secondProfileTrackIds),
    ];

    const sameTracks = new Set(
      [...firstProfileTrackIdsSet].filter((currentTrack) =>
        secondProfileTrackIdsSet.has(currentTrack),
      ),
    );
    const percentage =
      Math.round((sameTracks.size / firstProfileTrackIdsSet.size) * 100) || 0;
    const verdict = getVerdict(percentage);
    const totalTracks =
      firstProfileTrackIdsSet.size +
      secondProfileTrackIdsSet.size -
      sameTracks.size;

    const profileComparison: ProfileComparison = {
      percentage,
      verdict,
      sameHrefTracks: [...sameTracks],
      sameTracks: sameTracks.size,
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
