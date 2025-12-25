import { Body, Controller, Post } from '@nestjs/common';
import { ProfileParameters } from '@Profile/models/profile.parameters';
import { ProfileComparison } from '@Profile/models/profile-comparison.model';
import { ProfileService } from '@Profile/services/profile.service';

@Controller('compare')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async compare(
    @Body() { firstProfile, secondProfile, advanced }: ProfileParameters,
  ): Promise<ProfileComparison> {
    return await this.profileService.compareProfiles(
      firstProfile,
      secondProfile,
      advanced,
    );
  }
}
