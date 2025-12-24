import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from '@Utils/auth/services/auth.service';
import { ValidateProfileById } from '@Profile/services/useCases/validate-profile-by-id';

@Injectable()
export class ValidateProfileByIdService implements ValidateProfileById {
  url = 'https://api.spotify.com/v1/users/';

  constructor(private readonly authService: AuthService) {}
  async validate(id: string): Promise<boolean> {
    await this.authService.requestWithAuth(async (token) => {
      return await axios.get(`${this.url}${id}`, {
        headers: {
          Authorization: token,
        },
      });
    });
    return true;
  }
}
