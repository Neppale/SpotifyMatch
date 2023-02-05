export interface Profile {
  display_name: string;
  external_urls: Externalurls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  type: string;
  uri: string;
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
