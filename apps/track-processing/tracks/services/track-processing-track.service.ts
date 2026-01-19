import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SpotifyService } from '@Apps/shared/spotify/services/spotify.service';
import { DetailedTrack } from '@Apps/shared/tracks/models/detailed-track.model';

@Injectable()
export class TrackProcessingTrackService {
  private readonly url = 'https://api.spotify.com/v1/tracks/';

  constructor(private readonly spotifyService: SpotifyService) {}

  async getBatchedDetailedTracks(
    trackIds: string[],
  ): Promise<DetailedTrack[]> {
    const BATCH_SIZE = 50;
    const batches: string[][] = [];
    for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
      batches.push(trackIds.slice(i, i + BATCH_SIZE));
    }
    return await Promise.all(
      batches.map(async (batch: string[]) => {
        return await this.spotifyService.requestWithAuth(async (token) => {
          const response = await axios.get(
            `${this.url}?ids=${batch.join(',')}`,
            {
              headers: {
                Authorization: token,
              },
            },
          );
          return response.data.tracks as DetailedTrack[];
        });
      }),
    ).then((data) => {
      return data.flat().filter((track) => track !== null);
    });
  }
}
