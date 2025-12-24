import { CacheModule, Module } from '@nestjs/common';
import { ProfileController } from '@Profile/profile.controller';
import { FindPlaylistIdsByUserIdService } from '@Playlist/services/find-playlist-ids-by-user-id.service';
import { CompareProfilesByIdService } from '@Profile/services/compare-profiles-by-id.service';
import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';
import { FindTrackIdsByPlaylistIdsService } from '@Playlist/services/find-track-ids-by-playlist-ids.service';
import { FindSimilarTracksService } from '@Tracks/services/find-similar-tracks.service';
import { FindMinimizedTrackService } from '@Tracks/services/find-minimized-track.service';
import { ValidateProfileByIdService } from '@Profile/services/validate-profile-by-id.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core/constants';
import { CacheService } from '@Utils/cache/services/cache.service';
import { PrismaModule } from '@Prisma/prisma.module';
import { TrackRepository } from '@Tracks/repositories/track.repository';

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
    PrismaModule,
  ],
  controllers: [ProfileController],
  providers: [
    FindPlaylistIdsByUserIdService,
    CompareProfilesByIdService,
    GetAccessTokenService,
    FindTrackIdsByPlaylistIdsService,
    FindSimilarTracksService,
    FindMinimizedTrackService,
    TrackRepository,
    CacheService,
    ValidateProfileByIdService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
