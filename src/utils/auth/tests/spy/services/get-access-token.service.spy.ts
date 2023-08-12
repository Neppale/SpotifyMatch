import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';

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
