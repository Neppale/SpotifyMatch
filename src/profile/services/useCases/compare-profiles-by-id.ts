import { ProfileComparison } from '../../../profile/models/profile-comparison.model';
import { ProfileParameters } from '../../../profile/models/profile-parameters';

export interface CompareProfilesById {
  compare({
    firstProfile,
    secondProfile,
    advanced,
  }: ProfileParameters): Promise<ProfileComparison>;
}
