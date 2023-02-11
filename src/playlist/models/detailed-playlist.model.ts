export interface DetailedPlaylist {
  collaborative: boolean;
  description: string;
  external_urls: Externalurls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  public: boolean;
  snapshot_id: string;
  tracks: Tracks;
  type: string;
  uri: string;
}

interface Tracks {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: Item[];
}

export interface Item {
  added_at: string;
  added_by: Addedby;
  is_local: boolean;
  track: Track;
}

interface Track {
  album: Album;
  artists: Artist2[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: Externalids;
  external_urls: Externalurls;
  href: string;
  id: string;
  is_playable: boolean;
  linked_from: Linkedfrom;
  restrictions: Restrictions;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Linkedfrom {}

interface Artist2 {
  external_urls: Externalurls;
  followers: Followers;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}

interface Album {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  external_urls: Externalurls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  restrictions: Restrictions;
  type: string;
  uri: string;
  copyrights: Copyright[];
  external_ids: Externalids;
  genres: string[];
  label: string;
  popularity: number;
  album_group: string;
  artists: Artist[];
}

interface Artist {
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

interface Externalids {
  isrc: string;
  ean: string;
  upc: string;
}

interface Copyright {
  text: string;
  type: string;
}

interface Restrictions {
  reason: string;
}

interface Addedby {
  external_urls: Externalurls;
  followers: Followers;
  href: string;
  id: string;
  type: string;
  uri: string;
}

interface Owner {
  external_urls: Externalurls;
  followers: Followers;
  href: string;
  id: string;
  type: string;
  uri: string;
  display_name: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Followers {
  href: string;
  total: number;
}

interface Externalurls {
  spotify: string;
}
