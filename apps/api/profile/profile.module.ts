import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProfileController } from '@Apps/api/profile/controllers/profile.controller';
import { ProfileService } from '@Apps/api/profile/services/profile.service';
import { TracksApiService } from '@Apps/api/tracks/tracks-api.service';
import { ProfileSharedRepository } from '@Apps/shared/profile/profile-shared.repository';
import { TrackProcessingEventEmitter } from '@Apps/track-processing/services/track-processing-event-emitter.service';
import { ProfileComparer } from '@Apps/shared/profile/services/profile-comparer.service';
import { AuthModule } from '@Utils/auth/auth.module';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'process_tracks',
    }),
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    TracksApiService,
    ProfileSharedRepository,
    TrackProcessingEventEmitter,
    ProfileComparer,
  ],
  exports: [
    ProfileService,
    ProfileSharedRepository,
    TrackProcessingEventEmitter,
  ],
})
export class ProfileModule {}
