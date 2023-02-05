export class ProfileComparison {
  sameTracks: number;
  totalTracks: number;
  percentage: number;
  sameHrefTracks: string[];
  verdict: Verdict;
}

export enum Verdict {
  PERFECT_MATCH = 'Perfect Match!',
  GOOD_MATCH = 'Good Match!',
  BAD_MATCH = 'Bad Match!',
  NO_MATCH = 'No Match!',
}
