export interface FindTracksByPlaylistIds {
  find(id: string[]): Promise<string[]>;
}
