import { Track } from '@PrismaClient';
import { TrackWithVariantId } from '@Apps/shared/tracks/models/track-with-variant-id.model';

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
  tracks: TrackWithVariantId[];
  similarTracks: TrackWithVariantId[];
}
