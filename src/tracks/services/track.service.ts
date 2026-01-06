import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { Item } from '@Playlist/models/detailed-playlist.model';
import { Track } from '@PrismaClient';

@Injectable()
export class TrackService {
  url = 'https://api.spotify.com/v1/tracks/';

  constructor(
    private readonly authService: AuthService,
    readonly trackRepository: TrackRepository,
  ) {}

  async getTrack(trackId: string): Promise<Track> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${trackId}`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const trackData: DetailedTrack = response.data;
    const minimizedTrack: Track = {
      id: trackData.id,
      artistId: trackData.artists[0].id,
      artist: trackData.artists[0].name,
      title: trackData.name,
      album: trackData.album.name,
      releaseDate: trackData.album.release_date,
      durationMs: trackData.duration_ms,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return minimizedTrack;
  }

  async getTrackIdsByPlaylistIds(playlistIds: string[]): Promise<string[]> {
    const playlistUrl = 'https://api.spotify.com/v1/playlists/';
    const fields =
      'items(track(id,name,href,album(name,href),artists(name,href),duration_ms,popularity))';

    const playlistPromises = playlistIds.map(async (playlistId) => {
      const trackIds: string[] = [];
      let offset = 0;
      let total = 1;

      while (offset < total) {
        const response = await this.authService.requestWithAuth(
          async (token) => {
            return await axios.get(`${playlistUrl}${playlistId}/tracks`, {
              headers: {
                Authorization: token,
              },
              params: {
                limit: 50,
                offset,
                fields,
              },
            });
          },
        );
        const data = response.data;
        total = data.total ?? (data.items ? data.items.length : 0);
        if (Array.isArray(data.items)) {
          data.items.forEach((item: Item) => {
            const formattedTrackId = item.track?.id;
            if (formattedTrackId) trackIds.push(formattedTrackId);
          });
        }
        offset += 50;
      }
      return trackIds;
    });

    const results = await Promise.all(playlistPromises).then((results) =>
      results.flat(),
    );
    return results;
  }
}
