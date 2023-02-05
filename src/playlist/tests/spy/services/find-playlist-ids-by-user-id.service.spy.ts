import { FindPlaylistIdsByUserId } from 'src/playlist/services/useCases/find-playlist-ids-by-user-id';

export class FindPlaylistIdsByUserIdServiceSpy
  implements FindPlaylistIdsByUserId
{
  result: string[] = [];
  count = 0;

  async find(_id: string): Promise<string[]> {
    this.count++;
    return this.result;
  }
}
