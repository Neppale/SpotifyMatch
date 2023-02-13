import { FindTrackIdsByPlaylistIdsService } from 'src/playlist/services/find-track-ids-by-playlist-ids.service';
import { GetAccessTokenService } from '../../../../utils/auth/services/get-access-token.service';

export class FindTrackIdsByPlaylistIdsServiceSpy
  implements FindTrackIdsByPlaylistIdsService
{
  url: string;
  getAccessTokenService: GetAccessTokenService;
  count = 0;
  response: string[] = [];
  async find(_playlistIds: string[]): Promise<string[]> {
    this.count++;
    return this.response;
  }
}
