export interface Item {
  track?: {
    id: string;
    name: string;
    href: string;
    album: {
      name: string;
      href: string;
    };
    artists: Array<{
      name: string;
      href: string;
    }>;
    duration_ms: number;
    popularity: number;
  } | null;
}

