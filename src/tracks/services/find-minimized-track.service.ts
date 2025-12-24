import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';
import { GetAccessToken } from '@Utils/auth/services/useCases/get-access-token';
import { FindMinimizedTrack } from '@Tracks/services/useCases/find-minimized-track';
import { MinimizedTrack } from '@Tracks/models/minimized-track.model';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';

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
      artistId: trackData.artists[0].id,
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
