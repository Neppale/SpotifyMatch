export interface PlaylistData {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: Playlist[];
}

interface Playlist {
  collaborative: boolean;
  description: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  public: boolean;
  snapshot_id: string;
  tracks: MinimizedTracks;
  type: string;
  uri: string;
}

interface Owner {
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  type: string;
  uri: string;
  display_name: string;
}

interface MinimizedTracks {
  href: string;
  total: number;
}

interface Followers {
  href: string;
  total: number;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface ExternalUrls {
  spotify: string;
}
