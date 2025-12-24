import { CacheModule, Module } from '@nestjs/common';
import { ProfileController } from '@Profile/profile.controller';
import { ProfileService } from '@Profile/services/profile.service';
import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';
import { FindPlaylistIdsByUserIdService } from '@Playlist/services/find-playlist-ids-by-user-id.service';
import { FindTrackIdsByPlaylistIdsService } from '@Playlist/services/find-track-ids-by-playlist-ids.service';
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
  providers: [
    ProfileService,
    GetAccessTokenService,
    FindPlaylistIdsByUserIdService,
    FindTrackIdsByPlaylistIdsService,
    CacheService,
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
