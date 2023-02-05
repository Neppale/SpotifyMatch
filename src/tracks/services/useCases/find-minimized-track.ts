import { MinimizedTrack } from '../../models/minimized-track.model';

export interface FindMinimizedTrack {
  find(trackId: string): Promise<MinimizedTrack>;
}
