import { Injectable } from '@nestjs/common';
import { FindSimilarTracks } from './useCases/find-similar-tracks';
import axios from 'axios';
import { GetAccessTokenService } from '../../utils/auth/services/get-access-token.service';
import { GetAccessToken } from '../../utils/auth/services/useCases/get-access-token';
import { DetailedTrack } from '../models/detailed-track.model';
import { MinimizedTrack } from '../models/minimized-track.model';
import { ArtistTracks } from '../models/artist-tracks.model';

@Injectable()
export class FindSimilarTracksService implements FindSimilarTracks {
  url = 'https://api.spotify.com/v1/tracks/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }
  async find(
    firstProfileTracks: string[],
    secondProfileTracks: string[],
  ): Promise<MinimizedTrack[]> {
    const authorization = await this.getAccessTokenService.get();
    const batchesOfFirstProfileTracks: string[][] = [];

    for (let i = 0; i < firstProfileTracks.length; i += 50) {
      batchesOfFirstProfileTracks.push(firstProfileTracks.slice(i, i + 50));
    }

    const firstProfileTracksData = await Promise.all(
      batchesOfFirstProfileTracks.map(async (batch) => {
        const response = await axios.get(`${this.url}?ids=${batch}`, {
          headers: {
            Authorization: authorization,
          },
        });
        return response.data.tracks as DetailedTrack[];
      }),
    ).then((data) => {
      return data.flat();
    });

    const minimizedFirstProfileTracks: MinimizedTrack[] =
      firstProfileTracksData.map((track) => {
        return {
          artistId: track.artists[0]?.id,
          artist: track.artists[0]?.name,
          track: track.name,
          album: track.album.name,
          releaseDate: track.album.release_date,
          length: track.duration_ms,
          href: track.href,
        };
      });

    const firstProfileArtistTracks = new Map<string, ArtistTracks>();
    minimizedFirstProfileTracks.forEach((track) => {
      if (firstProfileArtistTracks.has(track.artistId)) {
        const artistTracks = firstProfileArtistTracks.get(track.artistId);
        artistTracks.tracks.push(track);
        firstProfileArtistTracks.set(track.artistId, artistTracks);
      } else {
        firstProfileArtistTracks.set(track.artistId, {
          artistId: track.artistId,
          tracks: [track],
        });
      }
    });

    const batchesOfSecondProfileTracks: string[][] = [];

    for (let i = 0; i < secondProfileTracks.length; i += 50) {
      batchesOfSecondProfileTracks.push(secondProfileTracks.slice(i, i + 50));
    }

    const secondProfileTracksData = await Promise.all(
      batchesOfSecondProfileTracks.map(async (batch) => {
        const response = await axios.get(`${this.url}?ids=${batch}`, {
          headers: {
            Authorization: authorization,
          },
        });
        return response.data.tracks as DetailedTrack[];
      }),
    ).then((data) => {
      return data.flat();
    });

    const minimizedSecondProfileTracks: MinimizedTrack[] =
      secondProfileTracksData.map((track) => {
        return {
          artistId: track.artists[0]?.id,
          artist: track.artists[0]?.name,
          track: track.name,
          album: track.album.name,
          releaseDate: track.album.release_date,
          length: track.duration_ms,
          href: track.href,
        };
      });

    const secondProfileArtistTracks = new Map<string, ArtistTracks>();
    minimizedSecondProfileTracks.forEach((track) => {
      if (secondProfileArtistTracks.has(track.artistId)) {
        const artistTracks = secondProfileArtistTracks.get(track.artistId);
        artistTracks.tracks.push(track);
        secondProfileArtistTracks.set(track.artistId, artistTracks);
      } else {
        secondProfileArtistTracks.set(track.artistId, {
          artistId: track.artistId,
          tracks: [track],
        });
      }
    });

    const similarTracks: MinimizedTrack[] = [];
    const smallestUser =
      firstProfileArtistTracks.size < secondProfileArtistTracks.size
        ? firstProfileArtistTracks
        : secondProfileArtistTracks;

    const biggestUser =
      firstProfileArtistTracks.size > secondProfileArtistTracks.size
        ? firstProfileArtistTracks
        : secondProfileArtistTracks;

    smallestUser.forEach((artistTracks) => {
      if (biggestUser.has(artistTracks.artistId)) {
        const firstProfileArtistTracks = artistTracks.tracks;
        const secondProfileArtistTracks = biggestUser.get(
          artistTracks.artistId,
        ).tracks;
        firstProfileArtistTracks.forEach((firstTrack) => {
          secondProfileArtistTracks.forEach((secondTrack) => {
            if (this.compareTracks(firstTrack, secondTrack))
              if (
                !similarTracks.some((track) => track.href === firstTrack.href)
              )
                similarTracks.push(firstTrack);
          });
        });
      }
    });

    return similarTracks;
  }

  private compareTracks(
    firstTrack: MinimizedTrack,
    secondTrack: MinimizedTrack,
  ): boolean {
    let score = 0;
    if (firstTrack.artist === secondTrack.artist) score++;
    if (firstTrack.track === secondTrack.track) score++;
    if (firstTrack.album === secondTrack.album) score++;
    if (firstTrack.releaseDate === secondTrack.releaseDate) score++;
    if (firstTrack.length === secondTrack.length) score++;
    if (score >= 3) return true;
    return false;
  }
}
