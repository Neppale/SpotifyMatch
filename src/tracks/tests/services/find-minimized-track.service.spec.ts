import axios from 'axios';
import { FindMinimizedTrackService } from '../../../tracks/services/find-minimized-track.service';
import { GetAccessTokenServiceSpy } from '../../../utils/auth/tests/spy/services/get-access-token.service.spy';

type SutOutput = {
  sut: FindMinimizedTrackService;
  getAccessTokenService: GetAccessTokenServiceSpy;
};

const makeSut = (): SutOutput => {
  const getAccessTokenService = new GetAccessTokenServiceSpy();
  const sut = new FindMinimizedTrackService(getAccessTokenService);
  return {
    sut,
    getAccessTokenService,
  };
};

describe('FindMinimizedTrackService', () => {
  it('should call GetAccessTokenService.get once', async () => {
    const { sut, getAccessTokenService } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(async () => {
      return {
        data: {
          name: 'any_name',
          artists: [
            {
              id: 'any_id',
              name: 'any_name',
            },
          ],
          album: {
            name: 'any_name',
            release_date: 'any_date',
          },
          href: 'any_href',
          duration_ms: 1000,
        },
      };
    });
    await sut.find('any_id');
    expect(getAccessTokenService.count).toBe(1);
  });

  it('should return MinimizedTrack if axios.get returns', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(async () => {
      return {
        data: {
          name: 'any_name',
          artists: [
            {
              id: 'any_id',
              name: 'any_name',
            },
          ],
          album: {
            name: 'any_name',
            release_date: 'any_date',
          },
          href: 'any_href',
          duration_ms: 1000,
        },
      };
    });
    const minimizedTrack = await sut.find('any_id');
    expect(minimizedTrack).toEqual({
      artistId: 'any_id',
      track: 'any_name',
      artist: 'any_name',
      album: 'any_name',
      href: 'any_href',
      length: 1000,
      releaseDate: 'any_date',
    });
  });
});
