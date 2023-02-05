import { ProfileComparison } from 'src/profile/models/profile-comparison.model';
import { ProfileParameters } from 'src/profile/models/profile-parameters';

export interface CompareProfilesById {
  compare({
    firstProfile,
    secondProfile,
  }: ProfileParameters): Promise<ProfileComparison>;
}
