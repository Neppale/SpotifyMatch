import { Controller, Get } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ProfileParameters } from './models/profile-parameters';
import { ProfileComparison } from './models/profile-comparison.model';
import { CompareProfilesByIdService } from './services/compare-profiles-by-id.service';
import { CompareProfilesById } from './services/useCases/compare-profiles-by-id';

@Controller()
export class ProfileController {
  compareProfilesByIdService: CompareProfilesById;

  constructor(compareProfilesByIdService: CompareProfilesByIdService) {
    this.compareProfilesByIdService = compareProfilesByIdService;
  }
  @Get()
  async compare(
    @Payload() { firstProfile, secondProfile, advanced }: ProfileParameters,
  ): Promise<ProfileComparison> {
    return await this.compareProfilesByIdService.compare({
      firstProfile,
      secondProfile,
      advanced,
    });
  }
}
