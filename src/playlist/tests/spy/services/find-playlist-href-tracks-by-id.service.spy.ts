import { FindPlaylistHrefTracksById } from 'src/playlist/services/useCases/find-playlist-href-tracks-by-id';

export class FindPlaylistHrefTracksByIdSpy
  implements FindPlaylistHrefTracksById
{
  result: string[] = [];
  count = 0;

  async find(_id: string): Promise<string[]> {
    this.count++;
    return this.result;
  }
}
