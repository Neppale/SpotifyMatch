import axios from 'axios';
import { GetAccessTokenServiceSpy } from '../../../utils/auth/tests/spy/services/get-access-token.service.spy';
import { detailedPlaylistMock } from '../../models/detailed-playlist.model';
import { FindTrackIdsByPlaylistIdsService } from '../../services/find-track-ids-by-playlist-ids.service';

type SutOutput = {
  sut: FindTrackIdsByPlaylistIdsService;
  getAccessTokenServiceSpy: GetAccessTokenServiceSpy;
};

const makeSut = (): SutOutput => {
  const getAccessTokenServiceSpy = new GetAccessTokenServiceSpy();
  const sut = new FindTrackIdsByPlaylistIdsService(getAccessTokenServiceSpy);
  return {
    sut,
    getAccessTokenServiceSpy,
  };
};

describe('FindTrackIdsByPlaylistIdsService', () => {
  it('should call getAccessTokenService.get once', async () => {
    const { sut, getAccessTokenServiceSpy } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          ...detailedPlaylistMock,
        },
      });
    });
    await sut.find(['id']);
    expect(getAccessTokenServiceSpy.count).toBe(1);
  });

  it('should return an empty array', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          tracks: {
            items: [],
          },
        },
      });
    });
    const trackIds = await sut.find(['id']);
    expect(trackIds).toEqual([]);
  });

  it('should return an array of track ids', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return Promise.resolve({
        data: {
          ...detailedPlaylistMock,
        },
      });
    });
    const trackIds = await sut.find(['id']);
    expect(trackIds).toEqual(['1AbCdEfG']);
  });
});
