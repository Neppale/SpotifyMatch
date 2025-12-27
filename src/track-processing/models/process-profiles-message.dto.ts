export interface ProcessProfilesMessage {
  sessionId: string;
  profiles: {
    spotifyIds: string[];
    snapshotId: string;
    profileId: string;
  }[];
}
