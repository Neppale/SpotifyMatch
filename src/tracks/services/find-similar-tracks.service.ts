import { Injectable } from '@nestjs/common';
import { FindSimilarTracks } from './useCases/find-similar-tracks';
import axios from 'axios';
import { GetAccessTokenService } from '../../utils/auth/services/get-access-token.service';
import { GetAccessToken } from '../../utils/auth/services/useCases/get-access-token';
import { DetailedTrack } from '../models/detailed-track.model';
import { MinimizedTrack } from '../models/minimized-track.model';

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
          artist: track.artists[0]?.name,
          track: track.name,
          album: track.album.name,
          releaseDate: track.album.release_date,
          length: track.duration_ms,
          href: track.href,
        };
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
          artist: track.artists[0]?.name,
          track: track.name,
          album: track.album.name,
          releaseDate: track.album.release_date,
          length: track.duration_ms,
          href: track.href,
        };
      });
    const similarTracks: MinimizedTrack[] = [];

    const largestProfileTracks =
      minimizedFirstProfileTracks.length > minimizedSecondProfileTracks.length
        ? minimizedFirstProfileTracks
        : minimizedSecondProfileTracks;

    const smallestProfileTracks =
      minimizedFirstProfileTracks.length < minimizedSecondProfileTracks.length
        ? minimizedFirstProfileTracks
        : minimizedSecondProfileTracks;

    largestProfileTracks.forEach((currentTrack) => {
      const similarTrack = smallestProfileTracks.find(
        (foundTrack) => currentTrack.track === foundTrack.track,
      );
      if (similarTrack) {
        if (this.compareTracks(currentTrack, similarTrack)) {
          similarTracks.push(similarTrack);
        }
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
