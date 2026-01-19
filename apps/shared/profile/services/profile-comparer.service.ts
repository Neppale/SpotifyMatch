import { Injectable } from '@nestjs/common';
import { ProfileComparisonFormattedResponse } from '@Apps/shared/profile/models/profile-comparison.model';
import { TrackWithVariantId } from '@Apps/shared/tracks/models/track-with-variant-id.model';

@Injectable()
export class ProfileComparer {
  compare(
    firstProfileTracks: TrackWithVariantId[],
    secondProfileTracks: TrackWithVariantId[],
  ): ProfileComparisonFormattedResponse {
    const profiles = [firstProfileTracks, secondProfileTracks];

    const exactTracks = this.filterExactTracks(profiles);

    const similarTracks = this.filterSimilarTracks(profiles, exactTracks);

    const allUniqueTrackIds = new Set<string>();
    for (const profile of profiles) {
      for (const track of profile) {
        allUniqueTrackIds.add(track.trackId);
      }
    }

    const totalTracks = firstProfileTracks.length + secondProfileTracks.length;
    const uniqueTracks = allUniqueTrackIds.size;
    const percentage =
      totalTracks === 0 ? 0 : Math.round((uniqueTracks / totalTracks) * 100);

    const formattedResponse: ProfileComparisonFormattedResponse = {
      message: this.buildMessage(
        percentage,
        totalTracks,
        exactTracks.length,
        similarTracks.length,
      ),
      callToAction: this.buildCallToAction(),
      exactTracks,
      similarTracks,
    };

    return formattedResponse;
  }

  private filterSimilarTracks(
    profiles: TrackWithVariantId[][],
    exactTracks: TrackWithVariantId[],
  ): TrackWithVariantId[] {
    if (!profiles || profiles.length === 0) {
      return [];
    }

    const exactTrackVariantIds = new Set<string>();
    for (const track of exactTracks) {
      exactTrackVariantIds.add(track.trackVariantId);
    }

    const trackSetsByTrackId = profiles.map((profileTracks) => {
      const trackMap = new Map<string, TrackWithVariantId[]>();
      for (const track of profileTracks) {
        if (!trackMap.has(track.trackId)) {
          trackMap.set(track.trackId, []);
        }
        trackMap.get(track.trackId)!.push(track);
      }
      return trackMap;
    });

    const [firstSet, ...otherSets] = trackSetsByTrackId;
    const similarTracks: TrackWithVariantId[] = [];

    firstSet.forEach((_tracks, trackId) => {
      const presentInAll = otherSets.every((set) => set.has(trackId));
      
      if (presentInAll) {
        const allVariants: TrackWithVariantId[] = [];
        for (const trackSet of trackSetsByTrackId) {
          const variants = trackSet.get(trackId) || [];
          allVariants.push(...variants);
        }

        const filteredVariants = allVariants.filter(
          (track) => !exactTrackVariantIds.has(track.trackVariantId),
        );

        const variantsByProfile: TrackWithVariantId[][] = [];
        for (const trackSet of trackSetsByTrackId) {
          const profileVariants = (trackSet.get(trackId) || []).filter(
            (track) => !exactTrackVariantIds.has(track.trackVariantId),
          );
          variantsByProfile.push(profileVariants);
        }

        const allProfilesHaveVariants = variantsByProfile.every(
          (variants) => variants.length > 0,
        );

        if (allProfilesHaveVariants && filteredVariants.length > 0) {
          const uniqueVariantIds = new Set<string>();
          for (const variant of filteredVariants) {
            uniqueVariantIds.add(variant.trackVariantId);
          }

          if (uniqueVariantIds.size > 1) {
            const addedVariants = new Set<string>();
            for (const variant of filteredVariants) {
              if (!addedVariants.has(variant.trackVariantId)) {
                similarTracks.push(variant);
                addedVariants.add(variant.trackVariantId);
              }
            }
          }
        }
      }
    });

    return similarTracks;
  }

  private filterExactTracks(
    tracks: TrackWithVariantId[][],
  ): TrackWithVariantId[] {
    if (!tracks || tracks.length === 0) {
      return [];
    }
    const trackSets = tracks.map((trackArr) => {
      const set = new Map<string, TrackWithVariantId>();
      for (const track of trackArr) {
        set.set(track.trackVariantId, track);
      }
      return set;
    });

    const [firstSet, ...otherSets] = trackSets;
    const exactTracks: TrackWithVariantId[] = [];
    firstSet.forEach((track, trackVariantId) => {
      const presentInAll = otherSets.every((set) => set.has(trackVariantId));
      if (presentInAll) {
        exactTracks.push(track);
      }
    });

    return exactTracks;
  }

  private buildMessage(
    percentage: number,
    totalTracks: number,
    exactTracks: number,
    similarTracks: number,
  ): string {
    const reactionMessage = this.getReactionMessage(percentage);
    const analysisMessage = `I analyzed ${totalTracks} tracks and found ${exactTracks} exact matches and ${similarTracks} probable matches between you two!`;
    return `${reactionMessage}\n${analysisMessage}`;
  }

  private getReactionMessage(percentage: number): string {
    // TODO: Build this later to gather AI generated reaction messages based on the most popular song they have in common. Just for funsies :)
    switch (percentage) {
      case 100:
        return 'You only listen to the same tracks! You are a perfect match!';
      case 80:
        return 'You gotta feel that heat, baby! Here are your results:';
      case 50:
        return 'You have some stuff in common, but are pretty different overall. Here are your results:';
      default:
        return 'Yeah, I think this one is a no-go. Sorry about that, but here are your results:';
    }
  }

  private buildCallToAction(): string {
    // TODO: Build this later to gather AI generated call to action messages based on the most popular song they have in common. Just for funsies :)
    return "...you're not even that into each other anyway, right? Wanna try again?";
  }
}
