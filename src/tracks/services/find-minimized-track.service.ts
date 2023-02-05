import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetAccessTokenService } from '../../utils/auth/services/get-access-token.service';
import { GetAccessToken } from '../../utils/auth/services/useCases/get-access-token';
import { FindMinimizedTrack } from './useCases/find-minimized-track';
import { MinimizedTrack } from '../models/minimized-track.model';
import { DetailedTrack } from '../models/detailed-track.model';

@Injectable()
export class FindMinimizedTrackService implements FindMinimizedTrack {
  url = 'https://api.spotify.com/v1/tracks/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }
  async find(id: string): Promise<MinimizedTrack> {
    const authorization = await this.getAccessTokenService.get();
    const response = await axios.get(`${this.url}${id}`, {
      headers: {
        Authorization: authorization,
      },
    });

    const trackData: DetailedTrack = response.data;
    const minimizedTrack: MinimizedTrack = {
      track: trackData.name,
      artist: trackData.artists[0].name,
      album: trackData.album.name,
      href: trackData.href,
      length: trackData.duration_ms,
      releaseDate: trackData.album.release_date,
    };

    return minimizedTrack;
  }
}
