import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';

export class GetAccessTokenServiceSpy implements GetAccessTokenService {
  clientSecret: string;
  clientId: string;
  accessToken = 'accessToken';
  count = 0;
  async get(): Promise<string> {
    this.count++;
    return this.accessToken;
  }
}
