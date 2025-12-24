import { Controller, Post } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ProfileParameters } from '@Profile/models/profile.parameters';
import { ProfileComparison } from '@Profile/models/profile-comparison.model';
import { ProfileService } from '@Profile/services/profile.service';
import { CacheService } from '@Utils/cache/services/cache.service';

@Controller('compare')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  async compare(
    @Payload() { firstProfile, secondProfile, advanced }: ProfileParameters,
  ): Promise<ProfileComparison> {
    const cachedResult = await this.cacheService.get(
      `${firstProfile}-${secondProfile}-${advanced}`,
    );
    if (cachedResult) return cachedResult;
    const result = await this.profileService.compareProfiles(
      firstProfile,
      secondProfile,
      advanced,
    );
    await this.cacheService.set(
      `${firstProfile}-${secondProfile}-${advanced}`,
      result,
    );
    return result;
  }
}
