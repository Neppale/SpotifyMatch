import { Controller, Post } from '@nestjs/common';
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
  @Post()
  async compare(
    @Payload() { firstProfile, secondProfile }: ProfileParameters,
  ): Promise<ProfileComparison> {
    return await this.compareProfilesByIdService.compare({
      firstProfile,
      secondProfile,
    });
  }
}
