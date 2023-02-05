import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfileParameters } from '../models/profile-parameters';
import { CompareProfilesById } from './useCases/compare-profiles-by-id';
import { FindPlaylistIdsByUserIdService } from '../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindPlaylistIdsByUserId } from '../../playlist/services/useCases/find-playlist-ids-by-user-id';
import { ProfileComparison, Verdict } from '../models/profile-comparison.model';

@Injectable()
export class CompareProfilesByIdService implements CompareProfilesById {
  findPlaylistHrefTracksByIdService: FindPlaylistIdsByUserId;

  constructor(
    findPlaylistHrefTracksByIdService: FindPlaylistIdsByUserIdService,
  ) {
    this.findPlaylistHrefTracksByIdService = findPlaylistHrefTracksByIdService;
  }
  async compare({
    firstProfile,
    secondProfile,
  }: ProfileParameters): Promise<ProfileComparison> {
    if (!firstProfile || !secondProfile) {
      throw new BadRequestException('Missing profile id');
    }

    const [firstProfileHrefTracks, secondProfileHrefTracks] = await Promise.all(
      [
        this.findPlaylistHrefTracksByIdService.find(firstProfile),
        this.findPlaylistHrefTracksByIdService.find(secondProfile),
      ],
    );

    const sameHrefTracks = firstProfileHrefTracks.filter((track) =>
      secondProfileHrefTracks.includes(track),
    );

    const totalTracks =
      firstProfileHrefTracks.length +
      secondProfileHrefTracks.length -
      sameHrefTracks.length;

    const percentage = (sameHrefTracks.length / totalTracks) * 100;

    const profileComparison: ProfileComparison = {
      sameTracks: sameHrefTracks.length,
      totalTracks,
      sameHrefTracks,
      percentage: (sameHrefTracks.length / totalTracks) * 100,
      verdict: getVerdict(percentage),
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
