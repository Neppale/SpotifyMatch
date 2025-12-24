import { ProfileComparison } from '@Profile/models/profile-comparison.model';
import { ProfileParameters } from '@Profile/models/profile.parameters';

export interface CompareProfilesById {
  compare({
    firstProfile,
    secondProfile,
    advanced,
  }: ProfileParameters): Promise<ProfileComparison>;
}
