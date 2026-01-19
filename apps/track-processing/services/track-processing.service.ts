import { Injectable, Logger } from '@nestjs/common';
import { TrackProcessingTrackRepository } from '@Apps/track-processing/tracks/track-processing-track.repository';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { DetailedTrack } from '@Apps/shared/tracks/models/detailed-track.model';
import { ProcessProfilesMessage } from '../profile/models/process-profiles-message.dto';
import { Prisma } from '@PrismaClient';
import { TrackProcessingEventEmitter } from './track-processing-event-emitter.service';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';
import { TrackProcessingTrackService } from '@Apps/track-processing/tracks/services/track-processing-track.service';

export interface NormalizedTrackData {
  artist: string;
  artistId: string;
  title: string;
  album: string;
  releaseDate: string;
  durationMs: number;
  popularity: number;
  variants: Prisma.TrackVariantCreateWithoutTrackInput[];
}

@Injectable()
export class TrackProcessingService {
  private readonly logger = new Logger(TrackProcessingService.name);

  constructor(
    private readonly trackRepository: TrackProcessingTrackRepository,
    private readonly profileRepository: ProfileSharedRepository,
    private readonly eventEmitter: TrackProcessingEventEmitter,
    private readonly profileComparer: ProfileComparer,
    private readonly trackProcessingTrackService: TrackProcessingTrackService,
  ) {}

  async processProfiles(data: ProcessProfilesMessage): Promise<void> {
    this.logger.log(
      `Processing ${data.profiles.length} profile(s) with track processing for session ${data.sessionId}`,
    );

    try {
      const allSpotifyIds = new Set<string>();
      for (const profile of data.profiles) {
        profile.spotifyIds.forEach((id) => allSpotifyIds.add(id));
      }

      const trackDataMap = await this.fetchAllTrackData(
        Array.from(allSpotifyIds),
      );

      const normalizedTracks = this.normalizeTrackData(trackDataMap);

      const tracksByArtistId = this.groupTracksByArtistId(normalizedTracks);

      await this.processTracksByArtistId(tracksByArtistId);

      this.eventEmitter.emitForSession('progress', data.sessionId, {
        progress: 80,
      });

      await this.saveProfilesAndLibraries(data.profiles);

      this.logger.log(`Processed ${allSpotifyIds.size} tracks`);

      // TODO: Build later to compare more than 2 profiles at a time!
      if (data.profiles.length === 2) {
        const [firstProfile, secondProfile] = data.profiles;
        const [firstProfileData, secondProfileData] = await Promise.all([
          this.profileRepository.findProfileWithLibrary(
            firstProfile.profileId,
            firstProfile.snapshotId,
          ),
          this.profileRepository.findProfileWithLibrary(
            secondProfile.profileId,
            secondProfile.snapshotId,
          ),
        ]);

        if (firstProfileData && secondProfileData) {
          const comparisonResult = this.profileComparer.compare(
            firstProfileData.tracks,
            secondProfileData.tracks,
          );

          this.eventEmitter.emitForSession('completed', data.sessionId, {
            success: true,
            data: comparisonResult,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process tracks for session ${data.sessionId}`,
        error,
      );
      this.eventEmitter.emitForSession('error', data.sessionId, {
        error: 'Failed to process tracks',
        details: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async fetchAllTrackData(
    spotifyIds: string[],
  ): Promise<Map<string, DetailedTrack>> {
    const trackDataMap = new Map<string, DetailedTrack>();

    const existingVariants =
      await this.trackRepository.getTracksBySpotifyId(spotifyIds);
    const existingSpotifyIds = new Set(existingVariants.map((v) => v.id));

    const tracksToFetch = spotifyIds.filter(
      (id) => !existingSpotifyIds.has(id),
    );

    if (tracksToFetch.length === 0) {
      for (const variant of existingVariants) {
        const track = variant.Track;
        trackDataMap.set(variant.id, {
          id: variant.id,
          name: track.title,
          artists: [{ id: track.artistId, name: track.artist }],
          album: { name: track.album, release_date: track.releaseDate },
          duration_ms: track.durationMs,
          popularity: variant.popularity || 0,
        } as DetailedTrack);
      }
      return trackDataMap;
    }

    const fetchedTracks = await this.trackProcessingTrackService.getBatchedDetailedTracks(tracksToFetch);
    const fetchedTrackIds = new Set<string>();
    for (const track of fetchedTracks) {
      if (track && track.id) {
        trackDataMap.set(track.id, track);
        fetchedTrackIds.add(track.id);
      }
    }

    const missingTrackIds = tracksToFetch.filter(
      (id) => !fetchedTrackIds.has(id),
    );
    if (missingTrackIds.length > 0) {
      this.logger.warn(
        `Spotify API did not return ${missingTrackIds.length} track(s): ${missingTrackIds.slice(0, 10).join(', ')}${missingTrackIds.length > 10 ? '...' : ''}`,
      );
    }

    for (const variant of existingVariants) {
      if (!trackDataMap.has(variant.id)) {
        const track = variant.Track;
        trackDataMap.set(variant.id, {
          id: variant.id,
          name: track.title,
          artists: [{ id: track.artistId, name: track.artist }],
          album: { name: track.album, release_date: track.releaseDate },
          duration_ms: track.durationMs,
          popularity: variant.popularity || 0,
        } as DetailedTrack);
      }
    }

    return trackDataMap;
  }

  private normalizeTrackData(
    trackDataMap: Map<string, DetailedTrack>,
  ): NormalizedTrackData[] {
    const normalized: NormalizedTrackData[] = [];

    for (const [spotifyId, track] of trackDataMap.entries()) {
      const imageUrl = this.getLargestImage(track.album?.images);
      
      normalized.push({
        artist: track.artists[0].name.toUpperCase(),
        artistId: track.artists[0].id,
        title: track.name.toUpperCase(),
        album: track.album?.name.toUpperCase() || '',
        releaseDate: track.album?.release_date || '',
        durationMs: track.duration_ms,
        popularity: track.popularity || 0,
        variants: [
          {
            id: spotifyId,
            isSourceTrack: false,
            score: 5,
            popularity: track.popularity || 0,
            imageUrl,
          },
        ],
      });
    }

    return normalized;
  }

  private groupTracksByArtistId(
    tracks: NormalizedTrackData[],
  ): Map<string, NormalizedTrackData[]> {
    const grouped = new Map<string, NormalizedTrackData[]>();

    for (const track of tracks) {
      if (!grouped.has(track.artistId)) {
        grouped.set(track.artistId, []);
      }
      grouped.get(track.artistId)!.push({
        artist: track.artist,
        artistId: track.artistId,
        title: track.title,
        album: track.album,
        releaseDate: track.releaseDate,
        durationMs: track.durationMs,
        popularity: track.popularity,
        variants: track.variants,
      });
    }

    return grouped;
  }

  private async processTracksByArtistId(
    tracksByArtistId: Map<string, NormalizedTrackData[]>,
  ): Promise<
    Map<string, Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>>
  > {
    const processed = new Map<
      string,
      Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>
    >();

    const SCORE_THRESHOLD = 4;
    const allUpsertPromises: Promise<{
      result: Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>;
      artistId: string;
    }>[] = [];

    for (const [artistId, tracks] of tracksByArtistId.entries()) {
      const existingTracks =
        await this.trackRepository.findTracksByArtistId(artistId);

      const allTrackIds = new Set<string>();
      for (const track of tracks) {
        for (const variant of track.variants) {
          allTrackIds.add(variant.id);
        }
      }

      const allTracksForArtist: Array<{
        track: NormalizedTrackData;
        existingTrackId?: string;
      }> = [];

      for (const track of tracks) {
        allTracksForArtist.push({ track });
      }

      for (const existingVariant of existingTracks) {
        if (!allTrackIds.has(existingVariant.id)) {
          const existingTrack = existingVariant.Track;
          allTracksForArtist.push({
            track: {
              artist: existingTrack.artist.toUpperCase(),
              artistId: existingTrack.artistId,
              title: existingTrack.title.toUpperCase(),
              album: existingTrack.album.toUpperCase(),
              releaseDate: existingTrack.releaseDate,
              durationMs: existingTrack.durationMs,
              popularity: existingVariant.popularity,
              variants: [
                {
                  id: existingVariant.id,
                  isSourceTrack: existingVariant.isSourceTrack,
                  score: existingVariant.score,
                  popularity: existingVariant.popularity,
                  imageUrl: existingVariant.imageUrl,
                },
              ],
            },
            existingTrackId: existingTrack.id,
          });
        }
      }

      const trackGroups: Array<{
        tracks: Array<{ track: NormalizedTrackData; existingTrackId?: string }>;
        allVariants: Prisma.TrackVariantCreateWithoutTrackInput[];
        targetTrackId?: string;
        artistId: string;
      }> = [];

      for (let i = 0; i < allTracksForArtist.length; i++) {
        const currentTrack = allTracksForArtist[i];
        let foundGroup = false;

        for (const group of trackGroups) {
          for (const groupTrack of group.tracks) {
            const score = this.getTrackVariantScore(
              groupTrack.track,
              currentTrack.track,
            );

            if (score >= SCORE_THRESHOLD) {
              group.tracks.push(currentTrack);
              for (const variant of currentTrack.track.variants) {
                variant.isSourceTrack = false;
                variant.score = score;
                group.allVariants.push(variant);
              }
              if (currentTrack.existingTrackId) {
                if (!group.targetTrackId) {
                  group.targetTrackId = currentTrack.existingTrackId;
                }
              }
              foundGroup = true;
              break;
            }
          }
          if (foundGroup) break;
        }

        if (!foundGroup) {
          const newGroup = {
            tracks: [currentTrack],
            allVariants: [...currentTrack.track.variants],
            targetTrackId: currentTrack.existingTrackId,
            artistId,
          };
          trackGroups.push(newGroup);
        }
      }

      for (const group of trackGroups) {
        if (group.allVariants.length === 0) {
          continue;
        }

        let mostPopularVariant = group.allVariants[0];
        for (const variant of group.allVariants) {
          if (variant.popularity > mostPopularVariant.popularity) {
            mostPopularVariant = variant;
          }
        }

        for (const variant of group.allVariants) {
          if (variant.id === mostPopularVariant.id) {
            variant.isSourceTrack = true;
            variant.score = 5;
          } else {
            variant.isSourceTrack = false;
            if (variant.score === 5) {
              const variantTrack = group.tracks.find((t) =>
                t.track.variants.some((v) => v.id === variant.id),
              );
              if (variantTrack) {
                const sourceTrack = group.tracks.find((t) =>
                  t.track.variants.some((v) => v.id === mostPopularVariant.id),
                );
                variant.score = this.getTrackVariantScore(
                  sourceTrack?.track || group.tracks[0].track,
                  variantTrack.track,
                );
              }
            }
          }
        }

        const representativeTrack = group.tracks[0].track;
        const trackDataForUpsert: Prisma.TrackCreateInput = {
          ...representativeTrack,
          ...(group.targetTrackId && { id: group.targetTrackId }),
        };

        const upsertPromise = this.trackRepository
          .upsertTrackWithVariants(trackDataForUpsert, group.allVariants)
          .then((result) => ({ result, artistId: group.artistId }));

        allUpsertPromises.push(upsertPromise);
      }
    }

    const results = await Promise.all(allUpsertPromises);

    for (const result of results) {
      if (!processed.has(result.artistId)) {
        processed.set(result.artistId, result.result);
      }
    }

    return processed;
  }

  private getTrackVariantScore(
    firstTrack: NormalizedTrackData,
    secondTrack: NormalizedTrackData,
  ): number {
    let score = 0;
    if (firstTrack.title === secondTrack.title) score += 2;
    if (firstTrack.album === secondTrack.album) score -= 1;
    if (firstTrack.releaseDate === secondTrack.releaseDate) score -= 1;
    if (firstTrack.durationMs === secondTrack.durationMs) score += 2;

    return score;
  }

  private getLargestImage(
    images: Array<{ url: string; height: number; width: number }> | undefined,
  ): string | null {
    if (!images || images.length === 0) {
      return null;
    }

    return images.reduce((largest, current) => {
      const largestArea = largest.height * largest.width;
      const currentArea = current.height * current.width;
      return currentArea > largestArea ? current : largest;
    }).url;
  }

  private async saveProfilesAndLibraries(
    profiles: ProcessProfilesMessage['profiles'],
  ): Promise<void> {
    await this.profileRepository.upsertManyProfiles(profiles);
  }

}
