import { CacheModule, Module } from '@nestjs/common';
import { ProfileController } from '@Profile/profile.controller';
import { ProfileService } from '@Profile/services/profile.service';
import { TrackModule } from '@Tracks/track.module';
import { CacheService } from '@Utils/cache/services/cache.service';

@Module({
  imports: [
    TrackModule,
    CacheModule.register({
      ttl: 60,
      max: 100,
    }),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, CacheService],
  exports: [ProfileService],
})
export class ProfileModule {}
