import { FindPlaylistHrefTracksByIdService } from 'src/playlist/services/find-playlist-href-tracks-by-id.service';
import {
  ProfileComparison,
  Verdict,
} from 'src/profile/models/profile-comparison.model';
import { ProfileParameters } from 'src/profile/models/profile-parameters';
import { CompareProfilesById } from 'src/profile/services/useCases/compare-profiles-by-id';

export class CompareProfilesByIdServiceSpy implements CompareProfilesById {
  findPlaylistHrefTracksByIdService: FindPlaylistHrefTracksByIdService;
  result: ProfileComparison = {
    sameTracks: 1,
    sameHrefTracks: [''],
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
