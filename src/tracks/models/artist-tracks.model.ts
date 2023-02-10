import { MinimizedTrack } from './minimized-track.model';

export interface ArtistTracks {
  artistId: string;
  tracks: MinimizedTrack[];
}
