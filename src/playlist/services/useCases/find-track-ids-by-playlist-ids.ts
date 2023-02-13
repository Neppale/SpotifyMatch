export interface FindTrackIdsByPlaylistIds {
  find(id: string[]): Promise<string[]>;
}
