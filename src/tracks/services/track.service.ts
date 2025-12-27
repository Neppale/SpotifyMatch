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
    const promises = playlistIds.map((playlistId) => {
      return this.authService.requestWithAuth(async (token) => {
        return await axios.get(`${playlistUrl}${playlistId}`, {
          headers: {
            Authorization: token,
          },
        });
      });
    });
    const responses = await Promise.all(promises);

    const tracks: string[] = [];
    responses.forEach((response) => {
      response.data.tracks.items.forEach((item: Item) => {
        const formattedTrackId = item.track?.href?.replace(
          'https://api.spotify.com/v1/tracks/',
          '',
        );
        if (formattedTrackId) tracks.push(formattedTrackId);
      });
    });

    return tracks;
  }
}
