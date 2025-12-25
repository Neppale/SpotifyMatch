import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { Track } from 'generated/prisma';
import { Item } from '@Playlist/models/detailed-playlist.model';
import { Prisma } from '@PrismaClient';

@Injectable()
export class TrackService {
  url = 'https://api.spotify.com/v1/tracks/';

  constructor(
    private readonly authService: AuthService,
    readonly trackRepository: TrackRepository,
  ) {}

  async getTrack(trackId: string): Promise<Track> {
    const response = await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${trackId}`, {
        headers: {
          Authorization: token,
        },
      });
    });

    const trackData: DetailedTrack = response.data;
    const minimizedTrack: Track = {
      id: trackData.id,
      spotifyId: trackData.id,
      artist: trackData.artists[0].name,
      title: trackData.name,
      album: trackData.album.name,
      releaseDate: trackData.album.release_date,
      durationMs: trackData.duration_ms,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return minimizedTrack;
  }

  async getSimilarTracks(
    firstProfileTrackIds: string[],
    secondProfileTrackIds: string[],
  ): Promise<Track[]> {
    const firstProfileTracksData =
      await this.getBatchedDetailedTracks(firstProfileTrackIds);

    const firstProfileTracks: Track[] = firstProfileTracksData.map((track) => {
      return {
        id: track.id,
        spotifyId: track.id,
        artist: track.artists[0]?.name,
        title: track.name,
        album: track.album.name,
        releaseDate: track.album.release_date,
        durationMs: track.duration_ms,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const firstProfileArtistTracks = new Map<string, Track[]>();
    firstProfileTracks.forEach((track) => {
      if (firstProfileArtistTracks.has(track.artist)) {
        firstProfileArtistTracks.get(track.artist).push(track);
      } else {
        firstProfileArtistTracks.set(track.artist, [track]);
      }
    });

    const secondProfileTracksData = await this.getBatchedDetailedTracks(
      secondProfileTrackIds,
    );

    const secondProfileTracks: Track[] = secondProfileTracksData.map(
      (track) => {
        return {
          id: track.id,
          spotifyId: track.id,
          artist: track.artists[0]?.name,
          title: track.name,
          album: track.album.name,
          releaseDate: track.album.release_date,
          durationMs: track.duration_ms,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    );

    const secondProfileArtistTracks = new Map<string, Track[]>();
    secondProfileTracks.forEach((track) => {
      if (secondProfileArtistTracks.has(track.artist)) {
        secondProfileArtistTracks.get(track.artist).push(track);
      } else {
        secondProfileArtistTracks.set(track.artist, [track]);
      }
    });

    const similarTracks: Track[] = [];
    const similarTrackHrefs = new Set<string>();
    const profileWithLeastTracks =
      firstProfileArtistTracks.size < secondProfileArtistTracks.size
        ? firstProfileArtistTracks
        : secondProfileArtistTracks;

    const profileWithMostTracks =
      firstProfileArtistTracks.size > secondProfileArtistTracks.size
        ? firstProfileArtistTracks
        : secondProfileArtistTracks;

    for (const [
      artistName,
      tracksFromSmallerProfile,
    ] of profileWithLeastTracks) {
      const tracksFromLargerProfile = profileWithMostTracks.get(artistName);
      if (tracksFromLargerProfile) {
        for (const firstTrack of tracksFromSmallerProfile) {
          for (const secondTrack of tracksFromLargerProfile) {
            if (await this.compareTracks(firstTrack, secondTrack)) {
              const trackKey = firstTrack.spotifyId;
              if (!similarTrackHrefs.has(trackKey)) {
                similarTrackHrefs.add(trackKey);
                similarTracks.push(firstTrack);
              }
              break;
            }
          }
        }
      }
    }

    // await this.trackRepository.createMany(
    //   similarTracks.map((track) => ({
    //     artist: track.artist,
    //     spotifyId: track.spotifyId,
    //     title: track.title,
    //     album: track.album,
    //     releaseDate: track.releaseDate,
    //     durationMs: track.durationMs,
    //   })),
    // );

    return similarTracks;
  }

  async getTrackIdsByPlaylistIds(playlistIds: string[]): Promise<string[]> {
    const playlistUrl = 'https://api.spotify.com/v1/playlists/';
    const promises = playlistIds.map((playlistId) => {
      return this.authService.requestWithAuth(async (token) => {
        return await axios.get(`${playlistUrl}${playlistId}`, {
          headers: {
            Authorization: token,
          },
        });
      });
    });
    const responses = await Promise.all(promises);

    const tracks: string[] = [];
    responses.forEach((response) => {
      response.data.tracks.items.forEach((item: Item) => {
        const formattedTrackId = item.track?.href?.replace(
          'https://api.spotify.com/v1/tracks/',
          '',
        );
        if (formattedTrackId) tracks.push(formattedTrackId);
      });
    });

    return tracks;
  }

  private async compareTracks(
    firstTrack: Track,
    secondTrack: Track,
  ): Promise<boolean> {
    const SCORE_THRESHOLD = 3;
    let score = 0;
    if (firstTrack.artist === secondTrack.artist) score++;
    if (firstTrack.title === secondTrack.title) score++;
    if (firstTrack.album === secondTrack.album) score++;
    if (firstTrack.releaseDate === secondTrack.releaseDate) score++;
    if (firstTrack.durationMs === secondTrack.durationMs) score++;

    if (score >= SCORE_THRESHOLD) {
      await this.handleTrackVariants(firstTrack, secondTrack, score);
      return true;
    }

    return false;
  }

  private async handleTrackVariants(
    firstTrack: Track,
    secondTrack: Track,
    score: number,
  ): Promise<void> {
    const firstSourceTrack =
      await this.trackRepository.findSourceTrackBySpotifyId(
        firstTrack.spotifyId,
      );
    const secondSourceTrack =
      await this.trackRepository.findSourceTrackBySpotifyId(
        secondTrack.spotifyId,
      );

    const trueSourceTrack = firstSourceTrack || secondSourceTrack;
    const nonSourceTrack = firstSourceTrack ? secondTrack : firstTrack;

    if (trueSourceTrack) {
      await this.trackRepository.upsertTrackVariant(
        trueSourceTrack.id,
        nonSourceTrack.spotifyId,
        true,
        score,
      );
    } else {
      const createdSourceTrack =
        await this.trackRepository.createSourceTrackWithVariants(
          {
            artist: firstTrack.artist,
            title: firstTrack.title,
            album: firstTrack.album,
            releaseDate: firstTrack.releaseDate,
            durationMs: firstTrack.durationMs,
          },
          [firstTrack.spotifyId, secondTrack.spotifyId],
          score,
        );

      await this.trackRepository.createVariantForSourceTrack(
        createdSourceTrack.id,
        secondTrack.spotifyId,
        score,
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
          const response = await axios.get(`${this.url}?ids=${batch}`, {
            headers: {
              Authorization: token,
            },
          });
          return response.data.tracks as DetailedTrack[];
        });
      }),
    ).then((data) => {
      return data.flat();
    });
  }
}
