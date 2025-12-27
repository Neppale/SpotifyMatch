import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProfileController } from '@Profile/profile.controller';
import { ProfileService } from '@Profile/services/profile.service';
import { TrackModule } from '@Tracks/track.module';
import { ProfileRepository } from '@Profile/services/profile.repository';

@Module({
  imports: [
    TrackModule,
    BullModule.registerQueue({
      name: 'process_tracks',
    }),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository],
  exports: [ProfileService, ProfileRepository],
})
export class ProfileModule {}
