export interface FindPlaylistIdsByUserId {
  find(id: string): Promise<string[]>;
}
