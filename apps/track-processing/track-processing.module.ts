import { Module } from '@nestjs/common';
import { TrackProcessingController } from './track-processing.controller';
import { TrackProcessingService } from './services/track-processing.service';
import { TrackProcessingEventEmitter } from './services/track-processing-event-emitter.service';
import { TrackProcessingProcessor } from './processors/track-processing.processor';
import { AuthModule } from '@Utils/auth/auth.module';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { FlagsmithModule } from '@Apps/shared/flagsmith/flagsmith.module';
import { RedisModule } from '@Apps/shared/redis/redis.module';
import { TracksTrackProcessingRepository } from '@Apps/track-processing/tracks/tracks-track-processing.repository';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';

@Module({
  imports: [
    PrismaModule,
    FlagsmithModule,
    RedisModule,
    AuthModule,
  ],
  controllers: [TrackProcessingController],
  providers: [
    TrackProcessingService,
    TrackProcessingEventEmitter,
    TrackProcessingProcessor,
    TracksTrackProcessingRepository,
    ProfileSharedRepository,
    ProfileComparer,
  ],
  exports: [TrackProcessingEventEmitter],
})
export class TrackProcessingModule {}
