import axios from 'axios';
import { FindPlaylistTracksByIdService } from '../../../playlist/services/find-playlist-tracks-by-id.service';
import { GetAccessTokenServiceSpy } from '../../../utils/auth/tests/spy/services/get-access-token.service.spy';

type SutOutput = {
  sut: FindPlaylistTracksByIdService;
  getAccessTokenServiceSpy: GetAccessTokenServiceSpy;
};

const makeSut = (): SutOutput => {
  const getAccessTokenServiceSpy = new GetAccessTokenServiceSpy();
  const sut = new FindPlaylistTracksByIdService(getAccessTokenServiceSpy);
  return {
    sut,
    getAccessTokenServiceSpy,
  };
};

describe('FindPlaylistTracksByIdService', () => {
  it('should call getAccessTokenService.get once', async () => {
    const { sut, getAccessTokenServiceSpy } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          tracks: {
            items: [
              {
                track: {
                  href: 'https://api.spotify.com/v1/tracks/trackId',
                },
              },
            ],
          },
        },
      });
    });
    await sut.find('id');
    expect(getAccessTokenServiceSpy.count).toBe(1);
  });

  it('should return an empty array', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          items: [],
        },
      });
    });
    const trackIds = await sut.find('id');
    expect(trackIds).toEqual([]);
  });

  it('should return an array of track ids', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          tracks: {
            items: [
              {
                track: {
                  href: 'https://api.spotify.com/v1/tracks/trackId',
                },
              },
            ],
          },
        },
      });
    });
    const trackIds = await sut.find('id');
    expect(trackIds).toEqual(['trackId']);
  });
});
