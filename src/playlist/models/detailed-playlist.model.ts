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

interface Item {
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

export const detailedPlaylistMock: DetailedPlaylist = {
  collaborative: true,
  description: 'This is a sample playlist for testing',
  external_urls: {
    spotify: 'https://open.spotify.com/playlist/1AbCdEfG',
  },
  followers: {
    href: 'https://api.spotify.com/v1/followers?offset=0&limit=20',
    total: 100,
  },
  href: 'https://api.spotify.com/v1/playlists/1AbCdEfG',
  id: '1AbCdEfG',
  images: [
    {
      url: 'https://i.scdn.co/image/ab67616d0000b273c4dc4f2ba4c4f2ba4c4f2ba',
      height: 640,
      width: 640,
    },
  ],
  name: 'Sample Playlist',
  owner: {
    display_name: 'Test User',
    external_urls: {
      spotify: 'https://open.spotify.com/user/testuser',
    },
    followers: {
      href: 'https://api.spotify.com/v1/followers?offset=0&limit=20',
      total: 500,
    },
    href: 'https://api.spotify.com/v1/users/testuser',
    id: 'testuser',
    type: 'user',
    uri: 'spotify:user:testuser',
  },
  public: true,
  snapshot_id: 'MTU3NzUzMjUwMDAwMDAwNjFhMzNlMmZmMjA1MmZmM2QwNGEzMjJmMGE=',
  tracks: {
    href: 'https://api.spotify.com/v1/playlists/1AbCdEfG/tracks?offset=0&limit=100',
    limit: 100,
    next: 'https://api.spotify.com/v1/playlists/1AbCdEfG/tracks?offset=100&limit=100',
    offset: 0,
    previous: null,
    total: 200,
    items: [
      {
        added_at: '2022-01-01T00:00:00Z',
        added_by: {
          external_urls: {
            spotify: 'https://open.spotify.com/user/testuser',
          },
          followers: {
            href: 'https://api.spotify.com/v1/followers?offset=0&limit=20',
            total: 500,
          },
          href: 'https://api.spotify.com/v1/users/testuser',
          id: 'testuser',
          type: 'user',
          uri: 'spotify:user:testuser',
        },
        is_local: false,
        track: {
          album: {
            album_type: 'album',
            total_tracks: 12,
            available_markets: [
              'AD',
              'AE',
              'AR',
              'AT',
              'AU',
              'BE',
              'BG',
              'BH',
              'BO',
              'BR',
              'CA',
              'CH',
              'CL',
              'CO',
              'CR',
              'CY',
              'CZ',
              'DE',
              'DK',
              'DO',
              'DZ',
              'EC',
              'EE',
              'EG',
              'ES',
              'FI',
              'FR',
              'GB',
              'GR',
              'GT',
              'HK',
              'HN',
              'HU',
              'ID',
              'IE',
              'IL',
              'IN',
              'IS',
              'IT',
              'JO',
              'JP',
              'KW',
              'LB',
              'LI',
              'LT',
              'LU',
              'LV',
              'MA',
              'MC',
              'MT',
              'MX',
              'MY',
              'NI',
              'NL',
              'NO',
              'NZ',
              'OM',
              'PA',
              'PE',
              'PH',
              'PL',
              'PS',
              'PT',
              'PY',
              'QA',
              'RO',
              'SA',
              'SE',
              'SG',
              'SK',
              'SV',
              'TH',
              'TN',
              'TR',
              'TW',
              'US',
              'UY',
              'VN',
              'ZA',
            ],
            external_urls: {
              spotify: 'https://open.spotify.com/album/1AbCdEfG',
            },
            href: 'https://api.spotify.com/v1/albums/1AbCdEfG',
            id: '1AbCdEfG',
            images: [
              {
                url: 'https://i.scdn.co/image/ab67616d0000b273c4dc4f2ba4c4f2ba4c4f2ba',
                height: 640,
                width: 640,
              },
            ],
            name: 'Sample Album',
            release_date: '2022-01-01',
            release_date_precision: 'day',
            restrictions: {
              reason: 'market',
            },
            type: 'album',
            uri: 'spotify:album:1AbCdEfG',
            external_ids: {
              isrc: 'USQX92200001',
              ean: '0000000000000',
              upc: '000000000000',
            },
            label: 'Sample Label',
            popularity: 50,
            album_group: 'album',
            artists: [
              {
                external_urls: {
                  spotify: 'https://open.spotify.com/artist/1AbCdEfG',
                },
                href: 'https://api.spotify.com/v1/artists/1AbCdEfG',
                id: '1AbCdEfG',
                name: 'Sample Artist',
                type: 'artist',
                uri: 'spotify:artist:1AbCdEfG',
              },
            ],
            copyrights: [
              {
                text: '© 2022 Sample Label',
                type: 'C',
              },
            ],
            genres: ['sample genre'],
          },
          is_playable: true,
          linked_from: {
            external_urls: {
              spotify: 'https://open.spotify.com/track/1AbCdEfG',
            },
            href: 'https://api.spotify.com/v1/tracks/1AbCdEfG',
            id: '1AbCdEfG',
            type: 'track',
            uri: 'spotify:track:1AbCdEfG',
          },
          artists: [
            {
              external_urls: {
                spotify: 'https://open.spotify.com/artist/1AbCdEfG',
              },
              href: 'https://api.spotify.com/v1/artists/1AbCdEfG',
              id: '1AbCdEfG',
              name: 'Sample Artist',
              type: 'artist',
              uri: 'spotify:artist:1AbCdEfG',
              followers: {
                href: 'https://api.spotify.com/v1/followers?offset=0&limit=20',
                total: 500,
              },
              genres: ['sample genre'],
              popularity: 50,
              images: [
                {
                  url: 'https://i.scdn.co/image/ab67616d0000b273c4dc4f2ba4c4f2ba4c4f2ba',
                  height: 640,
                  width: 640,
                },
              ],
            },
          ],
          available_markets: [
            'AD',
            'AE',
            'AR',
            'AT',
            'AU',
            'BE',
            'BG',
            'BH',
            'BO',
            'BR',
            'CA',
            'CH',
            'CL',
            'CO',
            'CR',
            'CY',
            'CZ',
            'DE',
            'DK',
            'DO',
            'DZ',
            'EC',
            'EE',
            'EG',
            'ES',
            'FI',
            'FR',
            'GB',
            'GR',
            'GT',
            'HK',
            'HN',
            'HU',
            'ID',
            'IE',
            'IL',
            'IN',
            'IS',
            'IT',
            'JO',
            'JP',
            'KW',
            'LB',
            'LI',
            'LT',
            'LU',
            'LV',
            'MA',
            'MC',
            'MT',
            'MX',
            'MY',
            'NI',
            'NL',
            'NO',
            'NZ',
            'OM',
            'PA',
            'PE',
            'PH',
            'PL',
            'PS',
            'PT',
            'PY',
            'QA',
            'RO',
            'SA',
            'SE',
            'SG',
            'SK',
            'SV',
            'TH',
            'TN',
            'TR',
            'TW',
            'US',
            'UY',
            'VN',
            'ZA',
          ],
          disc_number: 1,
          duration_ms: 300000,
          explicit: false,
          external_ids: {
            isrc: 'USQX92200001',
            ean: '0000000000000',
            upc: '000000000000',
          },
          external_urls: {
            spotify: 'https://open.spotify.com/track/1AbCdEfG',
          },
          href: 'https://api.spotify.com/v1/tracks/1AbCdEfG',
          id: '1AbCdEfG',
          is_local: false,
          name: 'Sample Track',
          popularity: 50,
          preview_url: 'https://p.scdn.co/mp3-preview/1AbCdEfG',
          restrictions: {
            reason: 'market',
          },
          track_number: 1,
          type: 'track',
          uri: 'spotify:track:1AbCdEfG',
        },
      },
    ],
  },
  type: 'track',
  uri: 'spotify:track:1AbCdEfG',
};
