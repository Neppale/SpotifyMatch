import { Injectable } from '@nestjs/common';
import { PlaylistData } from '../../profile/models/playlist-data.model';
import { FindPlaylistHrefTracksById } from './useCases/find-playlist-href-tracks-by-id';
import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { GetAccessToken } from 'src/utils/auth/services/useCases/get-access-token';
import axios from 'axios';

@Injectable()
export class FindPlaylistHrefTracksByIdService
  implements FindPlaylistHrefTracksById
{
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

    const playlistData: PlaylistData = response.data;
    if (!playlistData.items) return [];

    const hrefTracks: string[] = playlistData.items.map(
      (item) => item.tracks.href,
    );

    return hrefTracks;
  }
}
