import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '@Utils/auth/services/auth.service';
import { TrackService } from '@Tracks/services/track.service';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { ProfileRepository } from '@Profile/services/profile.repository';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';
import { ProcessProfilesMessage } from '../models/process-profiles-message.dto';
import { Prisma } from '@PrismaClient';
import axios from 'axios';

interface NormalizedTrackData {
  spotifyId: string;
  artist: string;
  title: string;
  album: string;
  releaseDate: string;
  durationMs: number;
  popularity: number;
  normalizedArtist: string;
  normalizedTitle: string;
  normalizedAlbum: string;
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

    await this.saveProfilesAndLibraries(data.profiles, processedTracks);
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
          artists: [{ name: track.artist }],
          album: { name: track.album, release_date: track.releaseDate },
          duration_ms: track.durationMs,
          popularity: 0,
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
        artists: [{ name: track.artist }],
        album: { name: track.album, release_date: track.releaseDate },
        duration_ms: track.durationMs,
        popularity: 0, // We'll need to fetch this separately if needed
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
      const title = track.name || '';
      const album = track.album?.name || '';

      normalized.push({
        spotifyId,
        artist: artist.toUpperCase(),
        title: title.toUpperCase(),
        album: album.toUpperCase(),
        releaseDate: track.album?.release_date || '',
        durationMs: track.duration_ms,
        popularity: track.popularity || 0,
        normalizedArtist: artist.toUpperCase(),
        normalizedTitle: title.toUpperCase(),
        normalizedAlbum: album.toUpperCase(),
      });
    }

    return normalized;
  }

  private groupTracksByArtist(
    tracks: NormalizedTrackData[],
  ): Map<string, NormalizedTrackData[]> {
    const grouped = new Map<string, NormalizedTrackData[]>();

    for (const track of tracks) {
      const artist = track.normalizedArtist;
      if (!grouped.has(artist)) {
        grouped.set(artist, []);
      }
      grouped.get(artist)!.push(track);
    }

    return grouped;
  }

  private async processTracksByArtist(
    tracksByArtist: Map<string, NormalizedTrackData[]>,
  ): Promise<
    Map<
      string,
      {
        sourceTrack: NormalizedTrackData;
        variants: NormalizedTrackData[];
        trackId?: string;
      }
    >
  > {
    const processed = new Map<
      string,
      {
        sourceTrack: NormalizedTrackData;
        variants: NormalizedTrackData[];
        trackId?: string;
      }
    >();

    const existingSpotifyIdsToFetch = new Set<string>();
    const existingTracksByArtist = new Map<
      string,
      Prisma.TrackVariantGetPayload<{ include: { Track: true } }>[]
    >();

    for (const [artist, tracks] of tracksByArtist.entries()) {
      const existingTracks =
        await this.trackRepository.findTracksByNormalizedArtist(artist);
      existingTracksByArtist.set(artist, existingTracks);

      const newTrackSpotifyIds = new Set(tracks.map((t) => t.spotifyId));
      for (const existingVariant of existingTracks) {
        if (!newTrackSpotifyIds.has(existingVariant.spotifyId)) {
          existingSpotifyIdsToFetch.add(existingVariant.spotifyId);
        }
      }
    }

    const existingTracksPopularity = new Map<string, number>();
    if (existingSpotifyIdsToFetch.size > 0) {
      try {
        const detailedTracks = await this.getBatchedDetailedTracks(
          Array.from(existingSpotifyIdsToFetch),
        );
        for (const track of detailedTracks) {
          existingTracksPopularity.set(track.id, track.popularity || 0);
        }
      } catch (error) {
        this.logger.warn(
          `Could not fetch popularity for some existing tracks: ${error}`,
        );
      }
    }

    for (const [artist, tracks] of tracksByArtist.entries()) {
      const existingTracks = existingTracksByArtist.get(artist) || [];
      const newTrackSpotifyIds = new Set(tracks.map((t) => t.spotifyId));

      const allTracksForArtist = [...tracks];

      for (const existingVariant of existingTracks) {
        if (!newTrackSpotifyIds.has(existingVariant.spotifyId)) {
          const existingTrack = existingVariant.Track;
          const popularity =
            existingTracksPopularity.get(existingVariant.spotifyId) || 0;

          allTracksForArtist.push({
            spotifyId: existingVariant.spotifyId,
            artist: existingTrack.artist.toUpperCase(),
            title: existingTrack.title.toUpperCase(),
            album: existingTrack.album.toUpperCase(),
            releaseDate: existingTrack.releaseDate,
            durationMs: existingTrack.durationMs,
            popularity,
            normalizedArtist: existingTrack.artist.toUpperCase(),
            normalizedTitle: existingTrack.title.toUpperCase(),
            normalizedAlbum: existingTrack.album.toUpperCase(),
          });
        }
      }

      allTracksForArtist.sort((a, b) => b.popularity - a.popularity);

      const sourceTrack = allTracksForArtist[0];
      const variants = allTracksForArtist.slice(1);

      const existingSourceVariant = existingTracks.find(
        (v) => v.spotifyId === sourceTrack.spotifyId && v.isSourceTrack,
      );

      processed.set(artist, {
        sourceTrack,
        variants,
        trackId: existingSourceVariant?.Track?.id,
      });
    }

    return processed;
  }

  private async saveTracksAndVariants(
    processedTracks: Map<
      string,
      {
        sourceTrack: NormalizedTrackData;
        variants: NormalizedTrackData[];
        trackId?: string;
      }
    >,
  ): Promise<void> {
    for (const [
      _artist,
      { sourceTrack, variants, trackId },
    ] of processedTracks) {
      let finalTrackId = trackId;

      if (!finalTrackId) {
        const existingSourceVariant =
          await this.trackRepository.getTracksBySpotifyId([
            sourceTrack.spotifyId,
          ]);

        if (existingSourceVariant.length > 0) {
          finalTrackId = existingSourceVariant[0].Track.id;
          if (!existingSourceVariant[0].isSourceTrack) {
            const createdTrack =
              await this.trackRepository.createSourceTrackWithVariants(
                {
                  artist: sourceTrack.artist,
                  title: sourceTrack.title,
                  album: sourceTrack.album,
                  releaseDate: sourceTrack.releaseDate,
                  durationMs: sourceTrack.durationMs,
                },
                [sourceTrack.spotifyId],
                5,
                sourceTrack.popularity,
              );
            finalTrackId = createdTrack.id;
          }
        } else {
          const createdTrack =
            await this.trackRepository.createSourceTrackWithVariants(
              {
                artist: sourceTrack.artist,
                title: sourceTrack.title,
                album: sourceTrack.album,
                releaseDate: sourceTrack.releaseDate,
                durationMs: sourceTrack.durationMs,
              },
              [sourceTrack.spotifyId],
              5,
              sourceTrack.popularity,
            );
          finalTrackId = createdTrack.id;
        }
      } else {
        await this.trackRepository.upsertTrackVariant(
          finalTrackId,
          sourceTrack.spotifyId,
          true,
          5,
          sourceTrack.popularity,
        );
      }

      for (const variant of variants) {
        const existingVariants =
          await this.trackRepository.getTracksBySpotifyId([variant.spotifyId]);

        if (existingVariants.length === 0) {
          await this.trackRepository.createVariantForSourceTrack(
            finalTrackId,
            variant.spotifyId,
            3,
            variant.popularity,
          );
        } else {
          const existingVariant = existingVariants[0];
          if (existingVariant.Track.id !== finalTrackId) {
            this.logger.warn(
              `Variant ${variant.spotifyId} already exists for a different track. Skipping.`,
            );
          }
        }
      }
    }
  }

  private async saveProfilesAndLibraries(
    profiles: ProcessProfilesMessage['profiles'],
    _processedTracks: Map<
      string,
      {
        sourceTrack: NormalizedTrackData;
        variants: NormalizedTrackData[];
        trackId?: string;
      }
    >,
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
}
