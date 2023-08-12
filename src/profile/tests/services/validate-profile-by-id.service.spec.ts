import axios from 'axios';
import { ValidateProfileByIdService } from '../../../profile/services/validate-profile-by-id.service';
import { GetAccessTokenServiceSpy } from '../../../utils/auth/tests/spy/services/get-access-token.service.spy';

type SutOutput = {
  sut: ValidateProfileByIdService;
  getAccessTokenService: GetAccessTokenServiceSpy;
};

const makeSut = (): SutOutput => {
  const getAccessTokenService = new GetAccessTokenServiceSpy();
  const sut = new ValidateProfileByIdService(getAccessTokenService);
  return {
    sut,
    getAccessTokenService,
  };
};

describe('ValidateProfileByIdService', () => {
  it('should call GetAccessTokenService.get once', async () => {
    const { sut, getAccessTokenService } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return new Promise((resolve) => resolve({}));
    });
    await sut.validate('any_id');
    expect(getAccessTokenService.count).toBe(1);
  });

  it('should return false if axios.get throws', async () => {
    const { sut, getAccessTokenService } = makeSut();
    jest.spyOn(getAccessTokenService, 'get').mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(sut.validate('any_id')).rejects.toThrow();
  });

  it('should return true if axios.get returns', async () => {
    const { sut } = makeSut();
    jest.spyOn(axios, 'get').mockImplementationOnce(() => {
      return new Promise((resolve) => resolve({}));
    });
    const isValid = await sut.validate('any_id');
    expect(isValid).toBe(true);
  });
});
