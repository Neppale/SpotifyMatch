export interface DetailedTrack {
  album: Album;
  artists: Artist[];
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

interface Artist {
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

interface Followers {
  href: string;
  total: number;
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

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Externalurls {
  spotify: string;
}

export const detailedTrackMock: DetailedTrack = {
  album: {
    album_type: 'any_album_type',
    total_tracks: 0,
    available_markets: ['any_market'],
    external_urls: {
      spotify: 'any_url',
    },
    href: 'any_href',
    id: 'any_id',
    images: [
      {
        url: 'any_url',
        height: 0,
        width: 0,
      },
      {
        url: 'any_url',
        height: 0,
        width: 0,
      },
      {
        url: 'any_url',
        height: 0,
        width: 0,
      },
    ],
    name: 'any_album_name',
    release_date: 'any_date',
    release_date_precision: 'any_precision',
    restrictions: {
      reason: 'any_reason',
    },
    type: 'any_type',
    uri: 'any_uri',
    album_group: 'any_group',
    artists: [
      {
        external_urls: {
          spotify: 'any_url',
        },
        href: 'any_href',
        id: 'any_id',
        name: 'any_artist_name',
        type: 'any_type',
        uri: 'any_uri',
        followers: {
          href: null,
          total: 0,
        },
        genres: [],
        images: [
          {
            url: 'any_url',
            height: 0,
            width: 0,
          },
        ],
        popularity: 0,
      },
    ],
    external_ids: {
      upc: 'any_upc',
      ean: 'any_ean',
      isrc: 'any_isrc',
    },
    genres: [],
    label: 'any_label',
    popularity: 0,
    copyrights: [
      {
        text: 'any_text',
        type: 'any_type',
      },
    ],
  },
  artists: [
    {
      name: 'any_artist_name',
      type: 'any_type',
      uri: 'any_uri',
      popularity: 0,
      external_urls: {
        spotify: 'any_url',
      },
      followers: {
        href: null,
        total: 0,
      },
      genres: [],
      href: 'any_href',
      id: 'any_id',
      images: [
        {
          url: 'any_url',
          height: 0,
          width: 0,
        },
        {
          url: 'any_url',
          height: 0,
          width: 0,
        },
        {
          url: 'any_url',
          height: 0,
          width: 0,
        },
      ],
    },
  ],
  name: 'any_artist_name',
  popularity: 0,
  type: 'any_type',
  disc_number: 0,
  duration_ms: 0,
  available_markets: ['any_market'],
  explicit: false,
  external_ids: {
    isrc: 'any_isrc',
    ean: 'any_ean',
    upc: 'any_upc',
  },
  external_urls: {
    spotify: 'any_url',
  },
  href: 'any_href',
  id: 'any_id',
  is_local: false,
  preview_url: 'any_url',
  track_number: 0,
  is_playable: false,
  linked_from: {
    external_urls: {
      spotify: 'any_url',
    },
    href: 'any_href',
    id: 'any_id',
    type: 'any_type',
  },
  restrictions: {
    reason: 'any_reason',
  },
  uri: 'any_uri',
};
