import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { MinimizedTrack } from '../../../../tracks/models/minimized-track.model';
import { FindSimilarTracksService } from '../../../../tracks/services/find-similar-tracks.service';

export class FindSimilarTracksServiceSpy implements FindSimilarTracksService {
  url: string;
  getAccessTokenService: GetAccessTokenService;
  findCount = 0;
  findResponse: MinimizedTrack[] = [
    {
      artistId: 'artistId',
      artist: 'artist',
      track: 'track',
      album: 'album',
      releaseDate: 'releaseDate',
      length: 1,
      href: 'href',
    },
  ];
  compareTracksResponse = true;
  compareTracksCount = 0;

  async find(_trackIds: string[]): Promise<MinimizedTrack[]> {
    this.findCount++;
    return this.findResponse;
  }

  compareTracks(
    firstTrack: MinimizedTrack,
    secondTrack: MinimizedTrack,
  ): boolean {
    this.compareTracksCount++;
    return this.compareTracksResponse;
  }
}
