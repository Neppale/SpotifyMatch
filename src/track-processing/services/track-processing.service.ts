import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { ProfileRepository } from '@Profile/services/profile.repository';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';
import { ProcessProfilesMessage } from '../models/process-profiles-message.dto';
import { Prisma } from '@PrismaClient';
import axios from 'axios';

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
  private readonly url = 'https://api.spotify.com/v1/tracks/';

  constructor(
    private readonly authService: AuthService,
    private readonly trackRepository: TrackRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async processProfiles(data: ProcessProfilesMessage): Promise<void> {
    this.logger.log(
      `Processing ${data.profiles.length} profile(s) with track processing for session ${data.sessionId}`,
    );

    const allSpotifyIds = new Set<string>();
    for (const profile of data.profiles) {
      profile.spotifyIds.forEach((id) => allSpotifyIds.add(id));
    }

    const trackDataMap = await this.fetchAllTrackData(
      Array.from(allSpotifyIds),
    );

    const normalizedTracks = this.normalizeTrackData(trackDataMap);

    const tracksByArtist = this.groupTracksByArtist(normalizedTracks);

    const processedTracks = await this.processTracksByArtist(tracksByArtist);

    await this.saveTracksAndVariants(processedTracks);
    await this.saveProfilesAndLibraries(data.profiles);
  }

  private async fetchAllTrackData(
    spotifyIds: string[],
  ): Promise<Map<string, DetailedTrack>> {
    const trackDataMap = new Map<string, DetailedTrack>();

    const existingVariants =
      await this.trackRepository.getTracksBySpotifyId(spotifyIds);
    const existingSpotifyIds = new Set(
      existingVariants.map((v) => v.spotifyId),
    );

    const tracksToFetch = spotifyIds.filter(
      (id) => !existingSpotifyIds.has(id),
    );

    if (tracksToFetch.length === 0) {
      for (const variant of existingVariants) {
        const track = variant.Track;
        trackDataMap.set(variant.spotifyId, {
          id: variant.spotifyId,
          name: track.title,
          artists: [{ id: track.artistId, name: track.artist }],
          album: { name: track.album, release_date: track.releaseDate },
          duration_ms: track.durationMs,
          popularity: variant.popularity || 0,
        } as DetailedTrack);
      }
      return trackDataMap;
    }

    const fetchedTracks = await this.getBatchedDetailedTracks(tracksToFetch);
    for (const track of fetchedTracks) {
      trackDataMap.set(track.id, track);
    }

    for (const variant of existingVariants) {
      const track = variant.Track;
      trackDataMap.set(variant.spotifyId, {
        id: variant.spotifyId,
        name: track.title,
        artists: [{ id: track.artistId, name: track.artist }],
        album: { name: track.album, release_date: track.releaseDate },
        duration_ms: track.durationMs,
        popularity: variant.popularity || 0,
      } as DetailedTrack);
    }

    return trackDataMap;
  }

  private normalizeTrackData(
    trackDataMap: Map<string, DetailedTrack>,
  ): NormalizedTrackData[] {
    const normalized: NormalizedTrackData[] = [];

    for (const [spotifyId, track] of trackDataMap.entries()) {
      const artist = track.artists[0]?.name || '';
      const artistId = track.artists[0]?.id || '';
      const title = track.name || '';
      const album = track.album?.name || '';

      normalized.push({
        artist: artist.toUpperCase(),
        artistId,
        title: title.toUpperCase(),
        album: album.toUpperCase(),
        releaseDate: track.album?.release_date || '',
        durationMs: track.duration_ms,
        popularity: track.popularity || 0,
        variants: [
          {
            spotifyId,
            isSourceTrack: false,
            score: 5,
            popularity: track.popularity || 0,
          },
        ],
      });
    }

    return normalized;
  }

  private groupTracksByArtist(
    tracks: NormalizedTrackData[],
  ): Map<string, NormalizedTrackData[]> {
    const grouped = new Map<string, NormalizedTrackData[]>();

    for (const track of tracks) {
      const artist = track.artist;
      if (!grouped.has(artist)) {
        grouped.set(artist, []);
      }
      grouped.get(artist)!.push({
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

  private async processTracksByArtist(
    tracksByArtist: Map<string, NormalizedTrackData[]>,
  ): Promise<
    Map<string, Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>>
  > {
    const processed = new Map<
      string,
      Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>
    >();

    for (const [artist, tracks] of tracksByArtist.entries()) {
      const existingTracks =
        await this.trackRepository.findTracksByNormalizedArtist(artist);

      const newTrackSpotifyIds = new Set<string>();
      for (const track of tracks) {
        for (const variant of track.variants) {
          newTrackSpotifyIds.add(variant.spotifyId);
        }
      }

      const allTracksForArtist: Array<{
        track: NormalizedTrackData;
        existingTrackId?: string;
        existingVariant?: Prisma.TrackVariantGetPayload<{
          include: { Track: true };
        }>;
      }> = [];

      for (const track of tracks) {
        allTracksForArtist.push({ track });
      }

      for (const existingVariant of existingTracks) {
        if (!newTrackSpotifyIds.has(existingVariant.spotifyId)) {
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
                  spotifyId: existingVariant.spotifyId,
                  isSourceTrack: existingVariant.isSourceTrack,
                  score: existingVariant.score,
                  popularity: existingVariant.popularity,
                },
              ],
            },
            existingTrackId: existingTrack.id,
            existingVariant,
          });
        }
      }

      allTracksForArtist.sort(
        (a, b) => b.track.popularity - a.track.popularity,
      );

      const sourceTrackData = allTracksForArtist[0];
      const variantTracksData = allTracksForArtist.slice(1);

      sourceTrackData.track.variants[0].isSourceTrack = true;
      sourceTrackData.track.variants[0].score = 5;

      const allVariants: Prisma.TrackVariantCreateWithoutTrackInput[] = [
        ...sourceTrackData.track.variants,
      ];

      for (const variantTrackData of variantTracksData) {
        for (const variant of variantTrackData.track.variants) {
          variant.isSourceTrack = false;
          variant.score = 3;
          allVariants.push(variant);
        }
      }

      let track: Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>;

      if (sourceTrackData.existingTrackId) {
        const existingTrack = await this.trackRepository.getTracksBySpotifyId([
          sourceTrackData.track.variants[0].spotifyId,
        ]);

        if (
          existingTrack.length > 0 &&
          existingTrack[0].Track.id === sourceTrackData.existingTrackId
        ) {
          track = await this.updateTrackWithVariants(
            sourceTrackData.existingTrackId,
            sourceTrackData.track,
            allVariants,
          );
        } else {
          track = await this.createTrackWithVariants(
            sourceTrackData.track,
            allVariants,
          );
        }
      } else {
        const existingVariants =
          await this.trackRepository.getTracksBySpotifyId([
            sourceTrackData.track.variants[0].spotifyId,
          ]);

        if (existingVariants.length > 0) {
          const existingTrack = existingVariants[0].Track;
          track = await this.updateTrackWithVariants(
            existingTrack.id,
            sourceTrackData.track,
            allVariants,
          );
        } else {
          track = await this.createTrackWithVariants(
            sourceTrackData.track,
            allVariants,
          );
        }
      }

      processed.set(artist, track);
    }

    return processed;
  }

  private async createTrackWithVariants(
    trackData: NormalizedTrackData,
    variants: Prisma.TrackVariantCreateWithoutTrackInput[],
  ): Promise<Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>> {
    const createdTrack =
      await this.trackRepository.createSourceTrackWithVariants(
        {
          artist: trackData.artist,
          artistId: trackData.artistId,
          title: trackData.title,
          album: trackData.album,
          releaseDate: trackData.releaseDate,
          durationMs: trackData.durationMs,
        },
        variants,
      );

    const trackWithVariants =
      await this.trackRepository.findTrackWithVariantsById(createdTrack.id);

    if (!trackWithVariants) {
      throw new Error('Failed to create track');
    }

    return trackWithVariants;
  }

  private async updateTrackWithVariants(
    trackId: string,
    trackData: NormalizedTrackData,
    variants: Prisma.TrackVariantCreateWithoutTrackInput[],
  ): Promise<Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>> {
    const sourceVariant = variants.find((v) => v.isSourceTrack) || variants[0];
    await this.trackRepository.upsertTrackVariant(
      trackId,
      sourceVariant.spotifyId,
      true,
      sourceVariant.popularity,
      sourceVariant.score,
    );

    for (const variant of variants) {
      if (!variant.isSourceTrack) {
        await this.trackRepository.createVariantForSourceTrack(
          trackId,
          variant,
        );
      }
    }

    const trackWithVariants =
      await this.trackRepository.findTrackWithVariantsById(trackId);

    if (!trackWithVariants) {
      throw new Error('Failed to update track');
    }

    return trackWithVariants;
  }

  private async saveProfilesAndLibraries(
    profiles: ProcessProfilesMessage['profiles'],
  ): Promise<void> {
    for (const profile of profiles) {
      await this.profileRepository.upsertProfile(
        profile.profileId,
        profile.spotifyIds,
        profile.snapshotId,
      );
    }
  }

  private async getBatchedDetailedTracks(
    trackIds: string[],
  ): Promise<DetailedTrack[]> {
    const BATCH_SIZE = 50;
    const batches: string[][] = [];
    for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
      batches.push(trackIds.slice(i, i + BATCH_SIZE));
    }
    return await Promise.all(
      batches.map(async (batch: string[]) => {
        return await this.authService.requestWithAuth(async (token) => {
          const response = await axios.get(
            `${this.url}?ids=${batch.join(',')}`,
            {
              headers: {
                Authorization: token,
              },
            },
          );
          return response.data.tracks as DetailedTrack[];
        });
      }),
    ).then((data) => {
      return data.flat().filter((track) => track !== null);
    });
  }

  private async saveTracksAndVariants(
    tracks: Map<
      string,
      Prisma.TrackGetPayload<{ include: { TrackVariant: true } }>
    >,
  ): Promise<void> {
    for (const [_artist, track] of tracks.entries()) {
      await this.trackRepository.createSourceTrackWithVariants(
        track,
        track.TrackVariant,
      );
    }
  }
}
