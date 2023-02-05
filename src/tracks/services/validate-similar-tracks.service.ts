import { Injectable } from '@nestjs/common';
import { ValidateSimilarTracks } from './useCases/validate-similar-tracks';
import axios from 'axios';
import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { GetAccessToken } from 'src/utils/auth/services/useCases/get-access-token';
import { DetailedTrack } from '../models/detailed-track.model';
import { MinimizedTrack } from '../models/minimized-track.model';

@Injectable()
export class ValidateSimilarTracksService implements ValidateSimilarTracks {
  url = 'https://api.spotify.com/v1/tracks/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }
  async validate(
    firstProfileTracks: string[],
    secondProfileTracks: string[],
  ): Promise<string[]> {
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
    const similarTracks: string[] = [];

    const largestProfile =
      minimizedFirstProfileTracks.length > minimizedSecondProfileTracks.length
        ? minimizedFirstProfileTracks
        : minimizedSecondProfileTracks;

    const smallestProfile =
      minimizedFirstProfileTracks.length < minimizedSecondProfileTracks.length
        ? minimizedFirstProfileTracks
        : minimizedSecondProfileTracks;

    largestProfile.forEach((currentTrack) => {
      const similarTrack = smallestProfile.find(
        (foundTrack) => currentTrack.track === foundTrack.track,
      );
      if (similarTrack) {
        if (this.compareTracks(currentTrack, similarTrack)) {
          similarTracks.push(currentTrack.href);
        }
      }
    });

    similarTracks.forEach((track, index) => {
      similarTracks[index] = track.replace(
        'https://api.spotify.com/v1/tracks/',
        '',
      );
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
