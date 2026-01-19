import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SpotifyService } from '@Apps/shared/spotify/services/spotify.service';
import { Item } from '@Playlist/models/detailed-playlist.model';

@Injectable()
export class ApiTrackService {
  constructor(private readonly spotifyService: SpotifyService) {}

  async getTrackIdsByPlaylistIds(playlistIds: string[]): Promise<string[]> {
    const playlistUrl = 'https://api.spotify.com/v1/playlists/';
    const fields =
      'items(track(id,name,href,album(name,href),artists(name,href),duration_ms,popularity))';

    const playlistPromises = playlistIds.map(async (playlistId) => {
      const trackIds: string[] = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        const response = await this.spotifyService.requestWithAuth(
          async (token) => {
            return await axios.get(`${playlistUrl}${playlistId}/tracks`, {
              headers: {
                Authorization: token,
              },
              params: {
                limit,
                offset,
                fields,
              },
            });
          },
        );
        const data = response.data;
        const itemsCount = data.items?.length || 0;
        hasMore = itemsCount === limit;
        if (Array.isArray(data.items)) {
          data.items.forEach((item: Item) => {
            const formattedTrackId = item.track?.id;
            if (formattedTrackId) trackIds.push(formattedTrackId);
          });
        }
        offset += limit;
      }
      return trackIds;
    });

    const results = await Promise.all(playlistPromises).then((results) =>
      results.flat(),
    );
    return results;
  }
}
