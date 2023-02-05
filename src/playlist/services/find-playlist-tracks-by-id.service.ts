import { Injectable } from '@nestjs/common';
import { FindPlaylistTracksById } from './useCases/find-playlist-tracks-by-id';
import axios from 'axios';
import { DetailedPlaylist } from '../models/detailed-playlist.model';
import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { GetAccessToken } from 'src/utils/auth/services/useCases/get-access-token';

@Injectable()
export class FindPlaylistTracksByIdService implements FindPlaylistTracksById {
  url = 'https://api.spotify.com/v1/playlists/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }
  async find(id: string): Promise<string[]> {
    const authorization = await this.getAccessTokenService.get();
    const response = await axios.get(`${this.url}${id}`, {
      headers: {
        Authorization: authorization,
      },
    });

    const playlistData: DetailedPlaylist = response.data;
    if (!playlistData.tracks) return [];

    const hrefTracks: string[] = playlistData.tracks.items.map(
      (item) => item.track.href,
    );

    hrefTracks.forEach((href, index) => {
      hrefTracks[index] = href.replace(
        'https://api.spotify.com/v1/tracks/',
        '',
      );
    });

    return hrefTracks;
  }
}
