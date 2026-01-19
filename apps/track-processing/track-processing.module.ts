import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TrackProcessingController } from './track-processing.controller';
import { TrackProcessingService } from './services/track-processing.service';
import { TrackProcessingEventEmitter } from './services/track-processing-event-emitter.service';
import { TrackProcessingProcessor } from './processors/track-processing.processor';
import { ClientsUnavailableExceptionHandler } from './handlers/clients-unavailable-exception.handler';
import { SpotifyModule } from '@Apps/shared/spotify/spotify.module';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { FlagsmithModule } from '@Apps/shared/flagsmith/flagsmith.module';
import { RedisModule } from '@Apps/shared/redis/redis.module';
import { TrackProcessingTrackRepository } from '@Apps/track-processing/tracks/track-processing-track.repository';
import { TrackProcessingTrackService } from '@Apps/track-processing/tracks/services/track-processing-track.service';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';

@Module({
  imports: [
    PrismaModule,
    FlagsmithModule,
    RedisModule,
    SpotifyModule,
  ],
  controllers: [TrackProcessingController],
  providers: [
    TrackProcessingService,
    TrackProcessingEventEmitter,
    TrackProcessingProcessor,
    TrackProcessingTrackRepository,
    TrackProcessingTrackService,
    ProfileSharedRepository,
    ProfileComparer,
    ClientsUnavailableExceptionHandler,
    {
      provide: APP_FILTER,
      useClass: ClientsUnavailableExceptionHandler,
    },
  ],
  exports: [TrackProcessingEventEmitter],
})
export class TrackProcessingModule {}
