import { MinimizedTrack } from '@Tracks/models/minimized-track.model';

export interface FindMinimizedTrack {
  find(trackId: string): Promise<MinimizedTrack>;
}
