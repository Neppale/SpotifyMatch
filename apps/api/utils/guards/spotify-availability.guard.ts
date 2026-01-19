import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { RedisService } from '@Apps/shared/redis/services/redis.service';

@Injectable()
export class SpotifyAvailabilityGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    const isAvailable = await this.redisService.checkSpotifyStatus();
    
    if (!isAvailable) {
      throw new ServiceUnavailableException({
        message: 'Spotify service is currently unavailable. Please try again later.',
      },
      );
    }

    return true;
  }
}
