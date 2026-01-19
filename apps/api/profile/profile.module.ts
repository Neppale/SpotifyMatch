import { Module } from '@nestjs/common';
import { ProfileService } from '@Apps/api/profile/services/profile.service';
import { ApiTrackService } from '@Apps/api/tracks/api-track.service';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { TrackProcessingEventEmitter } from '@Apps/track-processing/services/track-processing-event-emitter.service';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';
import { SpotifyModule } from '@Apps/shared/spotify/spotify.module';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { RedisModule } from '@Apps/shared/redis/redis.module';
import { SpotifyAvailabilityGuard } from '@Utils/guards/spotify-availability.guard';

@Module({
  imports: [
    SpotifyModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    ProfileService,
    ApiTrackService,
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
