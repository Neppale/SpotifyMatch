import { MinimizedTrack } from '@Tracks/models/minimized-track.model';

export interface FindSimilarTracks {
  find(
    firstProfileTracks: string[],
    secondProfileTracks: string[],
  ): Promise<MinimizedTrack[]>;
}
