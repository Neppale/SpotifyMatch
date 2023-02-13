import { GetAccessToken } from 'src/utils/auth/services/useCases/get-access-token';
import { ValidateProfileByIdService } from '../../../../profile/services/validate-profile-by-id.service';

export class ValidateProfileByIdServiceSpy
  implements ValidateProfileByIdService
{
  url: string;
  getAccessTokenService: GetAccessToken;
  count = 0;
  response = true;
  secondResponse = true;

  async validate(_id: string): Promise<boolean> {
    this.count++;
    if (this.count === 1) return this.response;
    return this.secondResponse;
  }
}
