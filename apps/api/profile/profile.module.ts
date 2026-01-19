import { Module } from '@nestjs/common';
import { ProfileService } from '@Apps/api/profile/services/profile.service';
import { TracksApiService } from '@Apps/api/tracks/tracks-api.service';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { TrackProcessingEventEmitter } from '@Apps/track-processing/services/track-processing-event-emitter.service';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';
import { AuthModule } from '@Utils/auth/auth.module';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { RedisModule } from '@Apps/shared/redis/redis.module';
import { SpotifyAvailabilityGuard } from '@Utils/guards/spotify-availability.guard';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    ProfileService,
    TracksApiService,
    ProfileSharedRepository,
    TrackProcessingEventEmitter,
    ProfileComparer,
    SpotifyAvailabilityGuard,
  ],
  exports: [
    ProfileService,
    ProfileSharedRepository,
    TrackProcessingEventEmitter,
  ],
})
export class ProfileModule {}
