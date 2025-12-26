import { Body, Controller, Post } from '@nestjs/common';
import { CompareProfileDto } from '@Profile/models/compare-profile.dto';
import { ProfileComparisonFormattedResponse } from '@Profile/models/profile-comparison.model';
import { ProfileService } from '@Profile/services/profile.service';

@Controller('compare')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async compare(
    @Body() { firstProfile, secondProfile, advanced }: CompareProfileDto,
  ): Promise<ProfileComparisonFormattedResponse> {
    return await this.profileService.compareProfiles(
      firstProfile,
      secondProfile,
      advanced,
    );
  }
}
