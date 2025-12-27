export interface ProcessProfilesMessage {
  profiles: {
    spotifyIds: string[];
    snapshotId: string;
    profileId: string;
  }[];
}

