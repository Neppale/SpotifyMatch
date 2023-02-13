import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { FindPlaylistIdsByUserIdService } from 'src/playlist/services/find-playlist-ids-by-user-id.service';

export class FindPlaylistIdsByUserIdServiceSpy
  implements FindPlaylistIdsByUserIdService
{
  url: string;
  getAccessTokenService: GetAccessTokenService;
  result: string[] = [];
  count = 0;

  async find(_id: string): Promise<string[]> {
    this.count++;
    return this.result;
  }
}
