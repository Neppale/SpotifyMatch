import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';
import { MinimizedTrack } from '@Tracks/models/minimized-track.model';
import { FindSimilarTracksService } from '@Tracks/services/find-similar-tracks.service';
import { TrackRepository } from '@Tracks/repositories/track.repository';

export class FindSimilarTracksServiceSpy implements FindSimilarTracksService {
  url: string;
  getAccessTokenService: GetAccessTokenService;
  readonly trackRepository: TrackRepository;
  findCount = 0;
  findResponse: MinimizedTrack[] = [
    {
      artistId: 'artistId',
      artist: 'artist',
      track: 'track',
      album: 'album',
      releaseDate: 'releaseDate',
      length: 1,
      href: 'href',
    },
  ];
  compareTracksResponse = true;
  compareTracksCount = 0;

  async find(_trackIds: string[]): Promise<MinimizedTrack[]> {
    this.findCount++;
    return this.findResponse;
  }

  compareTracks(
    firstTrack: MinimizedTrack,
    secondTrack: MinimizedTrack,
  ): boolean {
    this.compareTracksCount++;
    return this.compareTracksResponse;
  }
}
