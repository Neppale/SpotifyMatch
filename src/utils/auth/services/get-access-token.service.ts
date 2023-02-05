import axios from 'axios';
import { AccessTokenModel } from '../models/access-token.model';
import { GetAccessToken } from './useCases/get-access-token';

export class GetAccessTokenService implements GetAccessToken {
  clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  clientId = process.env.SPOTIFY_CLIENT_ID;

  async get(): Promise<string> {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.clientId}:${this.clientSecret}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const data: AccessTokenModel = response.data;
    return `Bearer ${data.access_token}`;
  }
}
