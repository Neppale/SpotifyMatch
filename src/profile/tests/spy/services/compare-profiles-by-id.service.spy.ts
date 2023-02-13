import { FindPlaylistIdsByUserIdService } from '../../../../playlist/services/find-playlist-ids-by-user-id.service';
import { FindTracksByPlaylistIdsService } from '../../../../playlist/services/find-track-ids-by-playlist-ids.service';
import {
  ProfileComparison,
  Verdict,
} from '../../../../profile/models/profile-comparison.model';
import { ProfileParameters } from '../../../../profile/models/profile-parameters';
import { CompareProfilesById } from '../../../../profile/services/useCases/compare-profiles-by-id';
import { FindSimilarTracksService } from '../../../../tracks/services/find-similar-tracks.service';

export class CompareProfilesByIdServiceSpy implements CompareProfilesById {
  findPlaylistIdsByIdService: FindPlaylistIdsByUserIdService;
  findPlaylistTracksByIdService: FindTracksByPlaylistIdsService;
  validateSimilarTracksService: FindSimilarTracksService;
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
