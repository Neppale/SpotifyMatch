import { Injectable } from '@nestjs/common';
import { ProfilePlaylistData } from '../../profile/models/profile-playlist-data.model';
import { FindPlaylistIdsByUserId } from './useCases/find-playlist-ids-by-user-id';
import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { GetAccessToken } from 'src/utils/auth/services/useCases/get-access-token';
import axios from 'axios';

@Injectable()
export class FindPlaylistIdsByUserIdService implements FindPlaylistIdsByUserId {
  url = 'https://api.spotify.com/v1/users/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }

  async find(id: string): Promise<string[]> {
    const authorization = await this.getAccessTokenService.get();
    const response = await axios.get(`${this.url}${id}/playlists`, {
      headers: {
        Authorization: authorization,
      },
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
