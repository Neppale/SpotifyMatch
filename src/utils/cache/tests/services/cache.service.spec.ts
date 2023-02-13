import { CacheService } from '../../services/cache.service';
import { CacheManagerSpy } from '../spy/services/cache.manager.spy';

type SutOutput = {
  sut: CacheService;
  cacheManager: CacheManagerSpy;
};

const makeSut = (): SutOutput => {
  const cacheManager = new CacheManagerSpy();
  const sut = new CacheService(cacheManager);
  return { sut, cacheManager };
};

describe('CacheService', () => {
  it('should call cacheManager.get once', async () => {
    const { sut, cacheManager } = makeSut();
    await sut.get('any_key');
    expect(cacheManager.getCount).toBe(1);
  });

  it('should call cacheManager.set once', async () => {
    const { sut, cacheManager } = makeSut();
    await sut.set('any_key', 'any_value');
    expect(cacheManager.setCount).toBe(1);
  });

  it('should call cacheManager.del once', async () => {
    const { sut, cacheManager } = makeSut();
    await sut.del('any_key');
    expect(cacheManager.delCount).toBe(1);
  });

  it('should call cacheManager.reset once', async () => {
    const { sut, cacheManager } = makeSut();
    await sut.flush();
    expect(cacheManager.resetCount).toBe(1);
  });
});
