import { Injectable } from '@nestjs/common';
import { ProfilePlaylistData } from '@Profile/models/profile-playlist-data.model';
import { FindPlaylistIdsByUserId } from '@Playlist/services/useCases/find-playlist-ids-by-user-id';
import { AuthService } from '@Utils/auth/services/auth.service';
import axios from 'axios';

@Injectable()
export class FindPlaylistIdsByUserIdService implements FindPlaylistIdsByUserId {
  url = 'https://api.spotify.com/v1/users/';

  constructor(private readonly authService: AuthService) {}

  async find(id: string): Promise<string[]> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${id}/playlists`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const playlistData: ProfilePlaylistData = response.data;
    if (!playlistData.items) return [];

    const playlistHrefs: string[] = playlistData.items.map(
      (item) => item.tracks.href,
    );

    playlistHrefs.forEach((href, index) => {
      playlistHrefs[index] = href.replace(
        'https://api.spotify.com/v1/playlists/',
        '',
      );
      playlistHrefs[index] = playlistHrefs[index].replace('/tracks', '');
    });

    return playlistHrefs;
  }
}
