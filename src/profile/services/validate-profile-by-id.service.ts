import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';
import { GetAccessToken } from '@Utils/auth/services/useCases/get-access-token';
import { ValidateProfileById } from '@Profile/services/useCases/validate-profile-by-id';

@Injectable()
export class ValidateProfileByIdService implements ValidateProfileById {
  url = 'https://api.spotify.com/v1/users/';
  getAccessTokenService: GetAccessToken;

  constructor(getAccessTokenService: GetAccessTokenService) {
    this.getAccessTokenService = getAccessTokenService;
  }
  async validate(id: string): Promise<boolean> {
    const authorization = await this.getAccessTokenService.get();

    await axios.get(`${this.url}${id}`, {
      headers: {
        Authorization: authorization,
      },
    });
    return true;
  }
}
