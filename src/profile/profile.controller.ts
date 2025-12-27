import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { CompareProfileDto } from '@Profile/models/compare-profile.dto';
import { ProfileService } from '@Profile/services/profile.service';
import { Response } from 'express';

@Controller('compare')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async compare(
    @Body()
    { firstProfile, secondProfile, advanced, saveResults }: CompareProfileDto,
    @Headers('x-session-id') sessionId: string,
    @Res() context: Response,
  ): Promise<void> {
    return await this.profileService.compareProfiles(
      context,
      {
        firstProfile,
        secondProfile,
        advanced,
        saveResults,
      },
      sessionId,
    );
  }
}
