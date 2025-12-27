import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { DetailedTrack } from '@Tracks/models/detailed-track.model';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { Item } from '@Playlist/models/detailed-playlist.model';
import { Track } from '@PrismaClient';

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
      artistId: trackData.artists[0].id,
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

  async getSimilarTracksWithoutDB(
    firstProfileTrackIds: string[],
    secondProfileTrackIds: string[],
  ): Promise<Track[]> {
    const [firstProfileTracksData, secondProfileTracksData] = await Promise.all(
      [
        this.getBatchedDetailedTracks(firstProfileTrackIds),
        this.getBatchedDetailedTracks(secondProfileTrackIds),
      ],
    );

    const firstProfileArtistTracks = new Map<string, Track[]>();

    for (const trackData of firstProfileTracksData) {
      const track: Track = {
        id: trackData.id,
        artistId: trackData.artists[0]?.id,
        artist: trackData.artists[0]?.name,
        title: trackData.name,
        album: trackData.album.name,
        releaseDate: trackData.album.release_date,
        durationMs: trackData.duration_ms,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existing = firstProfileArtistTracks.get(track.artist);
      if (existing) {
        existing.push(track);
      } else {
        firstProfileArtistTracks.set(track.artist, [track]);
      }
    }

    const secondProfileArtistTracks = new Map<string, Track[]>();

    for (const trackData of secondProfileTracksData) {
      const track: Track = {
        id: trackData.id,
        artistId: trackData.artists[0]?.id,
        artist: trackData.artists[0]?.name,
        title: trackData.name,
        album: trackData.album.name,
        releaseDate: trackData.album.release_date,
        durationMs: trackData.duration_ms,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existing = secondProfileArtistTracks.get(track.artist);
      if (existing) {
        existing.push(track);
      } else {
        secondProfileArtistTracks.set(track.artist, [track]);
      }
    }

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
          const trackKey = firstTrack.id;
          if (similarTrackHrefs.has(trackKey)) {
            continue;
          }
          for (const secondTrack of tracksFromLargerProfile) {
            if (this.compareTracksWithoutDB(firstTrack, secondTrack)) {
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

  private compareTracksWithoutDB(
    firstTrack: Track,
    secondTrack: Track,
  ): boolean {
    const SCORE_THRESHOLD = 3;
    let score = 0;
    if (firstTrack.artist === secondTrack.artist) score++;
    if (firstTrack.title === secondTrack.title) score++;
    if (firstTrack.album === secondTrack.album) score++;
    if (firstTrack.releaseDate === secondTrack.releaseDate) score++;
    if (firstTrack.durationMs === secondTrack.durationMs) score++;

    return score >= SCORE_THRESHOLD;
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
