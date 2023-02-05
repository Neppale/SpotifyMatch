import { ProfileController } from './profile/profile.controller';
import { CompareProfilesByIdServiceSpy } from './profile/tests/spy/services/compare-profiles-by-id.service.spy';

type SutOutput = {
  sut: ProfileController;
  compareProfilesByIdServiceSpy: CompareProfilesByIdServiceSpy;
};

const makeSut = (): SutOutput => {
  const compareProfilesByIdServiceSpy = new CompareProfilesByIdServiceSpy();
  const sut = new ProfileController(compareProfilesByIdServiceSpy);
  return {
    sut,
    compareProfilesByIdServiceSpy,
  };
};

describe('ProfileController', () => {
  it('should call compareProfilesByIdServiceSpy.compare once', async () => {
    const { sut, compareProfilesByIdServiceSpy } = makeSut();
    const profileParameters = {
      firstProfile: 'firstProfile',
      secondProfile: 'secondProfile',
    };
    await sut.compare(profileParameters);
    expect(compareProfilesByIdServiceSpy.count).toBe(1);
  });
});
