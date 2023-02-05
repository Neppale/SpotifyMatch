import { Controller, Get } from '@nestjs/common';
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
  compare({
    firstProfile,
    secondProfile,
  }: ProfileParameters): Promise<ProfileComparison> {
    return this.compareProfilesByIdService.compare({
      firstProfile,
      secondProfile,
    });
  }
}
