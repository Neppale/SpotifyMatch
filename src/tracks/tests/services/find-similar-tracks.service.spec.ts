import axios from 'axios';
import { FindSimilarTracksService } from '../../../tracks/services/find-similar-tracks.service';
import { GetAccessTokenServiceSpy } from '../../../utils/auth/tests/spy/services/get-access-token.service.spy';
import { detailedTrackMock } from '../../../tracks/models/detailed-track.model';

type SutOutput = {
  sut: FindSimilarTracksService;
  getAccessTokenService: GetAccessTokenServiceSpy;
};

const makeSut = (): SutOutput => {
  const getAccessTokenService = new GetAccessTokenServiceSpy();
  const sut = new FindSimilarTracksService(getAccessTokenService);
  return {
    sut,
    getAccessTokenService,
  };
};

describe('FindSimilarTracksService', () => {
  it('should call GetAccessTokenService.get once', async () => {
    const { sut, getAccessTokenService } = makeSut();
    await sut.find([], []);
    expect(getAccessTokenService.count).toBe(1);
  });

  it('should return an array of MinimizedTrack if axios.get returns', async () => {
    const { sut } = makeSut();
    const expectedResponse = [
      {
        album: detailedTrackMock.album.name,
        artist: detailedTrackMock.artists[0].name,
        artistId: detailedTrackMock.artists[0].id,
        href: detailedTrackMock.href,
        length: detailedTrackMock.duration_ms,
        releaseDate: detailedTrackMock.album.release_date,
        track: detailedTrackMock.name,
      },
    ];
    jest.spyOn(axios, 'get').mockImplementation(async () => {
      return {
        data: {
          tracks: [detailedTrackMock],
        },
      };
    });

    const minimizedTracks = await sut.find(['any_id'], ['any_id']);
    expect(minimizedTracks).toEqual(expectedResponse);
  });
});
