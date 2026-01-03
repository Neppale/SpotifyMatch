import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProfileController } from '@Profile/profile.controller';
import { ProfileService } from '@Profile/services/profile.service';
import { TrackModule } from '@Tracks/track.module';
import { ProfileRepository } from '@Profile/services/profile.repository';
import { TrackProcessingEventEmitter } from '../track-processing/services/track-processing-event-emitter.service';
import { ProfileComparer } from '@Shared/services/profile-comparer.service';

@Module({
  imports: [
    TrackModule,
    BullModule.registerQueue({
      name: 'process_tracks',
    }),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    ProfileRepository,
    TrackProcessingEventEmitter,
    ProfileComparer,
  ],
  exports: [ProfileService, ProfileRepository, TrackProcessingEventEmitter],
})
export class ProfileModule {}
