import { Module } from '@nestjs/common';
import { ProfileController } from '@Profile/profile.controller';
import { ProfileService } from '@Profile/services/profile.service';
import { TrackModule } from '@Tracks/track.module';

@Module({
  imports: [TrackModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
