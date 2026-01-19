import { TrackWithVariantId } from '@Apps/shared/tracks/models/track-with-variant-id.model';

export class ProfileComparisonFormattedResponse {
  message: string;
  callToAction: string;
  exactTracks: TrackWithVariantId[];
  similarTracks: TrackWithVariantId[];
  unavailableTracks: TrackWithVariantId[];
}
