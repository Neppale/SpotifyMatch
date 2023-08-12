import { ProfileComparison, Verdict } from '../models/profile-comparison.model';
import { ProfileController } from '../profile.controller';
import { CompareProfilesByIdServiceSpy } from './spy/services/compare-profiles-by-id.service.spy';
import { CacheServiceSpy } from '../../utils/cache/tests/spy/services/cache.service.spy';

type SutOutput = {
  sut: ProfileController;
  compareProfilesByIdServiceSpy: CompareProfilesByIdServiceSpy;
  cacheServiceSpy: CacheServiceSpy;
};

const makeSut = (): SutOutput => {
  const compareProfilesByIdServiceSpy = new CompareProfilesByIdServiceSpy();
  const cacheServiceSpy = new CacheServiceSpy();
  const sut = new ProfileController(
    compareProfilesByIdServiceSpy,
    cacheServiceSpy,
  );
  return {
    sut,
    compareProfilesByIdServiceSpy,
    cacheServiceSpy,
  };
};

describe('ProfileController', () => {
  it('should call cacheService.get once', async () => {
    const { sut, cacheServiceSpy } = makeSut();
    const profileParameters = {
      firstProfile: 'firstProfile',
      secondProfile: 'secondProfile',
    };
    await sut.compare(profileParameters);
    expect(cacheServiceSpy.getCount).toBe(1);
  });

  it('should return cachedResult when defined', async () => {
    const { sut, cacheServiceSpy } = makeSut();
    const profileParameters = {
      firstProfile: 'firstProfile',
      secondProfile: 'secondProfile',
    };
    const cachedResult: ProfileComparison = {
      matches: [],
      percentage: 0,
      sameTracks: 0,
      totalTracks: 0,
      verdict: Verdict.NO_MATCH,
    };

    cacheServiceSpy.response = cachedResult;
    const result = await sut.compare(profileParameters);
    expect(result).toEqual(cachedResult);
  });

  it('should call compareProfilesByIdServiceSpy.compare once', async () => {
    const { sut, compareProfilesByIdServiceSpy } = makeSut();
    const profileParameters = {
      firstProfile: 'firstProfile',
      secondProfile: 'secondProfile',
    };
    await sut.compare(profileParameters);
    expect(compareProfilesByIdServiceSpy.count).toBe(1);
  });

  it('should call cacheService.set once', async () => {
    const { sut, cacheServiceSpy } = makeSut();
    const profileParameters = {
      firstProfile: 'firstProfile',
      secondProfile: 'secondProfile',
    };
    await sut.compare(profileParameters);
    expect(cacheServiceSpy.setCount).toBe(1);
  });
});
