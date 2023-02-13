import { Injectable } from '@nestjs/common';
import { FindTrackIdsByPlaylistIds } from './useCases/find-track-ids-by-playlist-ids';
import axios from 'axios';
import { Item } from '../models/detailed-playlist.model';
import { GetAccessTokenService } from '../../utils/auth/services/get-access-token.service';
import { GetAccessToken } from '../../utils/auth/services/useCases/get-access-token';

@Injectable()
export class FindTrackIdsByPlaylistIdsService
  implements FindTrackIdsByPlaylistIds
{
  url = 'https://api.spotify.com/v1/playlists/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }
  async find(playlistIds: string[]): Promise<string[]> {
    const authorization = await this.getAccessTokenService.get();
    const promises = playlistIds.map((playlistId) => {
      return axios.get(`${this.url}${playlistId}`, {
        headers: {
          Authorization: authorization,
        },
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
