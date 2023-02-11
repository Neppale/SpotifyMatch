import { GetAccessTokenServiceSpy } from '../../../utils/auth/tests/spy/services/get-access-token.service.spy';
import { FindPlaylistIdsByUserIdService } from '../../services/find-playlist-ids-by-user-id.service';
import axios from 'axios';

type SutOutput = {
  sut: FindPlaylistIdsByUserIdService;
  getAccessTokenServiceSpy: GetAccessTokenServiceSpy;
};

const makeSut = (): SutOutput => {
  const getAccessTokenServiceSpy = new GetAccessTokenServiceSpy();
  const sut = new FindPlaylistIdsByUserIdService(getAccessTokenServiceSpy);
  return {
    sut,
    getAccessTokenServiceSpy,
  };
};

describe('FindPlaylistIdsByUserIdService', () => {
  it('should call getAccessTokenService.get once', async () => {
    const { sut, getAccessTokenServiceSpy } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          items: [
            {
              tracks: {
                href: 'https://api.spotify.com/v1/playlists/playlistId/tracks',
              },
            },
          ],
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
          items: undefined,
        },
      });
    });
    const playlistIds = await sut.find('id');
    expect(playlistIds).toEqual([]);
  });

  it('should return an array of playlist ids', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          items: [
            {
              tracks: {
                href: 'https://api.spotify.com/v1/playlists/playlistId/tracks',
              },
            },
          ],
        },
      });
    });
    const playlistIds = await sut.find('id');
    expect(playlistIds).toEqual(['playlistId']);
  });
});
