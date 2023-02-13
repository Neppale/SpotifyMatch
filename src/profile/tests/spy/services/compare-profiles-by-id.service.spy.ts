import { FindPlaylistIdsByUserIdService } from '../../../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindTrackIdsByPlaylistIdsService } from '../../../../playlist/services/find-track-ids-by-playlist-ids.service';
import {
  ProfileComparison,
  Verdict,
} from '../../../../profile/models/profile-comparison.model';
import { ProfileParameters } from '../../../models/profile.parameters';
import { FindSimilarTracksService } from '../../../../tracks/services/find-similar-tracks.service';
import { CompareProfilesByIdService } from 'src/profile/services/compare-profiles-by-id.service';
import { ValidateProfileById } from 'src/profile/services/useCases/validate-profile-by-id';
import { FindMinimizedTrack } from 'src/tracks/services/useCases/find-minimized-track';

export class CompareProfilesByIdServiceSpy
  implements CompareProfilesByIdService
{
  findMinimizedTrackService: FindMinimizedTrack;
  validateProfileByIdService: ValidateProfileById;
  findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService;
  findTrackIdsByPlaylistIdsService: FindTrackIdsByPlaylistIdsService;
  findSimilarTracksService: FindSimilarTracksService;

  result: ProfileComparison = {
    sameTracks: 1,
    matches: [
      {
        album: 'album',
        artist: 'artist',
        artistId: 'artistId',
        href: 'href',
        length: 1,
        releaseDate: 'releaseDate',
        track: 'track',
      },
    ],
    percentage: 100,
    totalTracks: 1,
    verdict: Verdict.PERFECT_MATCH,
  };

  count = 0;

  async compare(
    _profileParameters: ProfileParameters,
  ): Promise<ProfileComparison> {
    this.count++;
    return this.result;
  }
}
