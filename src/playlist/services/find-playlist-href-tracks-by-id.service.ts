import { Injectable } from '@nestjs/common';
import { PlaylistData } from '../../profile/models/playlist-data.model';
import { FindPlaylistHrefTracksById } from './useCases/find-playlist-href-tracks-by-id';

@Injectable()
export class FindPlaylistHrefTracksByIdService
  implements FindPlaylistHrefTracksById
{
  authorization = process.env.SPOTIFY_AUTHORIZATION;
  url = 'https://api.spotify.com/v1/users/';

  async find(id: string): Promise<string[]> {
    const response = await fetch(`${this.url}${id}/playlists`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authorization}`,
      },
    });

    const playlistData: PlaylistData = await response.json();
    const hrefTracks: string[] = playlistData.items.map(
      (item) => item.tracks.href,
    );

    return hrefTracks;
  }
}
