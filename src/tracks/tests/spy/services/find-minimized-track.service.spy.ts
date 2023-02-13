import { MinimizedTrack } from 'src/tracks/models/minimized-track.model';
import { FindMinimizedTrackService } from '../../../../tracks/services/find-minimized-track.service';
import { GetAccessTokenService } from '../../../../utils/auth/services/get-access-token.service';

export class FindMinimizedTrackServiceSpy implements FindMinimizedTrackService {
  url: string;
  getAccessTokenService: GetAccessTokenService;
  count = 0;
  response: MinimizedTrack = {
    artistId: 'artistId',
    track: 'track',
    artist: 'artist',
    album: 'album',
    href: 'href',
    length: 1,
    releaseDate: '1990-01-01',
  };
  async find(_id: string): Promise<MinimizedTrack> {
    this.count++;
    return this.response;
  }
}
