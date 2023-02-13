import { CacheModule, Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { FindPlaylistIdsByUserIdService } from '../playlist/services/find-playlist-ids-by-user-id.service';
import { CompareProfilesByIdService } from './services/compare-profiles-by-id.service';
import { GetAccessTokenService } from '../utils/auth/services/get-access-token.service';
import { FindTracksByPlaylistIdsService } from '../playlist/services/find-track-ids-by-playlist-ids.service';
import { FindSimilarTracksService } from '../tracks/services/find-similar-tracks.service';
import { FindMinimizedTrackService } from 'src/tracks/services/find-minimized-track.service';
import { ValidateProfileByIdService } from './services/validate-profile-by-id.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core/constants';
import { CacheService } from 'src/utils/cache/services/cache.service';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    CacheModule.register({
      ttl: 60,
      max: 100,
    }),
  ],
  controllers: [ProfileController],
  providers: [
    FindPlaylistIdsByUserIdService,
    CompareProfilesByIdService,
    GetAccessTokenService,
    FindTracksByPlaylistIdsService,
    FindSimilarTracksService,
    FindMinimizedTrackService,
    CacheService,
    ValidateProfileByIdService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
