import { Track } from 'generated/prisma';

export class ProfileComparison {
  totalExactTracks: number;
  totalTracksAnalyzed: number;
  percentage: number;
  exactTracks: Track[];
  similarTracks?: Track[];
  totalSimilarTracks?: number;
}

export class ProfileComparisonFormattedResponse {
  message: string;
  callToAction: string;
  similarTracks: Track[];
  exactTracks: Track[];
}
