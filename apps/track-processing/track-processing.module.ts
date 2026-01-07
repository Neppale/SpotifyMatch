import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TrackProcessingController } from './track-processing.controller';
import { TrackProcessingService } from './services/track-processing.service';
import { TrackProcessingEventEmitter } from './services/track-processing-event-emitter.service';
import { TrackProcessingProcessor } from './processors/track-processing.processor';
import { AuthModule } from '@Utils/auth/auth.module';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { TracksTrackProcessingRepository } from '@Apps/track-processing/tracks/tracks-track-processing.repository';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';
import * as dotenv from 'dotenv';

dotenv.config();
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'process_tracks',
    }),
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
