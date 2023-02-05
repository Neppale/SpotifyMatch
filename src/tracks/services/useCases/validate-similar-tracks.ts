export interface ValidateSimilarTracks {
  validate(
    firstProfileTracks: string[],
    secondProfileTracks: string[],
  ): Promise<any>;
}
