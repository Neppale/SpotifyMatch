import { Controller, Post } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ProfileParameters } from './models/profile.parameters';
import { ProfileComparison } from './models/profile-comparison.model';
import { CompareProfilesByIdService } from './services/compare-profiles-by-id.service';
import { CompareProfilesById } from './services/useCases/compare-profiles-by-id';
import { CacheService } from '../utils/cache/services/cache.service';

@Controller('compare')
export class ProfileController {
  compareProfilesByIdService: CompareProfilesById;

  constructor(
    compareProfilesByIdService: CompareProfilesByIdService,
    private readonly cacheService: CacheService,
  ) {
    this.compareProfilesByIdService = compareProfilesByIdService;
  }
  @Post()
  async compare(
    @Payload() { firstProfile, secondProfile, advanced }: ProfileParameters,
  ): Promise<ProfileComparison> {
    const cachedResult = await this.cacheService.get(
      `${firstProfile}-${secondProfile}`,
    );
    if (cachedResult) return cachedResult;
    const result = await this.compareProfilesByIdService.compare({
      firstProfile,
      secondProfile,
      advanced,
    });
    await this.cacheService.set(`${firstProfile}-${secondProfile}`, result);
    return result;
  }
}
