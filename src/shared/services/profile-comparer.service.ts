import { Injectable } from '@nestjs/common';
import { ProfileComparisonFormattedResponse } from '@Profile/models/profile-comparison.model';
import { TrackWithVariantId } from '@Tracks/models/track-with-variant-id.model';

@Injectable()
export class ProfileComparer {
  compare(
    firstProfileTracks: TrackWithVariantId[],
    secondProfileTracks: TrackWithVariantId[],
  ): ProfileComparisonFormattedResponse {
    const smallerProfileTracks =
      firstProfileTracks.length < secondProfileTracks.length
        ? firstProfileTracks
        : secondProfileTracks;
    const largerProfileTracks =
      firstProfileTracks.length < secondProfileTracks.length
        ? secondProfileTracks
        : firstProfileTracks;

    const sameTracks = new Map<
      string,
      {
        trackId: string;
        artist: string;
        artistId: string;
        title: string;
        album: string;
        releaseDate: string;
        durationMs: number;
        trackVariantId: string;
      }
    >();
    for (const track of smallerProfileTracks) {
      sameTracks.set(track.trackId, {
        ...track,
        trackVariantId: track.trackVariantId,
      });
    }
    for (const track of largerProfileTracks) {
      sameTracks.set(track.trackId, {
        ...track,
        trackVariantId: track.trackVariantId,
      });
    }

    const similarTracks = this.filterSimilarTracks(
      smallerProfileTracks,
      largerProfileTracks,
      sameTracks,
    );
    const totalTracks =
      smallerProfileTracks.length +
      largerProfileTracks.length -
      sameTracks.size;
    const percentage =
      totalTracks === 0 ? 0 : Math.round((sameTracks.size / totalTracks) * 100);
    const formattedResponse: ProfileComparisonFormattedResponse = {
      message: this.buildMessage(percentage, totalTracks, sameTracks.size, 0),
      callToAction: this.buildCallToAction(),
      tracks: Array.from(sameTracks.values()),
      similarTracks,
    };

    return formattedResponse;
  }

  private filterSimilarTracks(
    smallerProfileTracks: TrackWithVariantId[],
    largerProfileTracks: TrackWithVariantId[],
    sameTracks: Map<string, TrackWithVariantId>,
  ): TrackWithVariantId[] {
    const similarTracks: TrackWithVariantId[] = [];
    for (const track of sameTracks.values()) {
      const trackVariants = [
        smallerProfileTracks.find((t) => t.trackId === track.trackId)
          ?.trackVariantId,
        largerProfileTracks.find((t) => t.trackId === track.trackId)
          ?.trackVariantId,
      ];
      if (this.areTrackVariantsDifferent(trackVariants))
        similarTracks.push({
          trackId: track.trackId,
          artist: track.artist,
          artistId: track.artistId,
          title: track.title,
          album: track.album,
          releaseDate: track.releaseDate,
          durationMs: track.durationMs,
          trackVariantId: track.trackVariantId,
        });
    }
    return similarTracks;
  }

  private areTrackVariantsDifferent(
    trackVariants: (string | undefined)[],
  ): boolean {
    return trackVariants.some(
      (variant, index) => variant !== trackVariants[index + 1],
    );
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
