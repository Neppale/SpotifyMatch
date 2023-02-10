import { MinimizedTrack } from '../../tracks/models/minimized-track.model';

export class ProfileComparison {
  sameTracks: number;
  totalTracks: number;
  percentage: number;
  matches: MinimizedTrack[];
  probableMatches?: MinimizedTrack[];
  totalProbableMatches?: number;
  verdict: Verdict;
}

export enum Verdict {
  PERFECT_MATCH = 'Perfect Match!',
  GOOD_MATCH = 'Good Match!',
  BAD_MATCH = 'Bad Match!',
  NO_MATCH = 'No Match!',
}
