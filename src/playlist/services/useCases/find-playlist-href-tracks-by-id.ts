export interface FindPlaylistHrefTracksById {
  find(id: string): Promise<string[]>;
}
