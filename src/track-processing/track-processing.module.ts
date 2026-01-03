import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TrackProcessingController } from './track-processing.controller';
import { TrackProcessingService } from './services/track-processing.service';
import { TrackProcessingEventEmitter } from './services/track-processing-event-emitter.service';
import { TrackProcessingProcessor } from './processors/track-processing.processor';
import { AuthModule } from '@Utils/auth/auth.module';
import { PrismaModule } from '@Prisma/prisma.module';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { TrackService } from '@Tracks/services/track.service';
import { ProfileRepository } from '@Profile/services/profile.repository';
import { ProfileComparer } from '@Shared/services/profile-comparer.service';
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
    TrackRepository,
    TrackService,
    ProfileRepository,
    ProfileComparer,
  ],
  exports: [TrackProcessingEventEmitter],
})
export class TrackProcessingModule {}
