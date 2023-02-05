export interface FindPlaylistTracksById {
  find(id: string): Promise<string[]>;
}
