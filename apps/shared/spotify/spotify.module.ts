import { Global, Module } from '@nestjs/common';
import { SpotifyService } from '@Apps/shared/spotify/services/spotify.service';

@Global()
@Module({
  providers: [SpotifyService],
  exports: [SpotifyService],
})
export class SpotifyModule {}
