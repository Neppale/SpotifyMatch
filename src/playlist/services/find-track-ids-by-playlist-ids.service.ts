import { Injectable } from '@nestjs/common';
import { FindTrackIdsByPlaylistIds } from '@Playlist/services/useCases/find-track-ids-by-playlist-ids';
import axios from 'axios';
import { Item } from '@Playlist/models/detailed-playlist.model';
import { AuthService } from '@Utils/auth/services/auth.service';

@Injectable()
export class FindTrackIdsByPlaylistIdsService
  implements FindTrackIdsByPlaylistIds
{
  url = 'https://api.spotify.com/v1/playlists/';

  constructor(private readonly authService: AuthService) {}
  async find(playlistIds: string[]): Promise<string[]> {
    const promises = playlistIds.map((playlistId) => {
      return this.authService.requestWithAuth(async (token) => {
        return await axios.get(`${this.url}${playlistId}`, {
          headers: {
            Authorization: token,
          },
        });
      });
    });
    const responses = await Promise.all(promises);

    const tracks: string[] = [];
    responses.forEach((response) => {
      response.data.tracks.items.forEach((item: Item) => {
        const formattedTrackId = item.track?.href.replace(
          'https://api.spotify.com/v1/tracks/',
          '',
        );
        if (formattedTrackId) tracks.push(formattedTrackId);
      });
    });

    return tracks;
  }
}
