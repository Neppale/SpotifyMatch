import axios from 'axios';
import { GetAccessTokenService } from '../../services/get-access-token.service';

type SutOutput = {
  sut: GetAccessTokenService;
};

const makeSut = (): SutOutput => {
  const sut = new GetAccessTokenService();
  return {
    sut,
  };
};

describe('GetAccessTokenService', () => {
  it('should return Bearer any_token', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'post').mockImplementationOnce(async () => {
      return {
        data: {
          access_token: 'any_token',
          token_type: 'any_type',
          expires_in: 3600,
        },
      };
    });
    const accessToken = await sut.get();
    expect(accessToken).toBe('Bearer any_token');
  });
});
