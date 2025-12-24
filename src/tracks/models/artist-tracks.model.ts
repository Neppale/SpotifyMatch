import { MinimizedTrack } from '@Tracks/models/minimized-track.model';

export interface ArtistTracks {
  artistId: string;
  tracks: MinimizedTrack[];
}
