import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { FindPlaylistHrefTracksByIdService } from 'src/playlist/services/find-playlist-href-tracks-by-id.service';
import { CompareProfilesByIdService } from './services/compare-profiles-by-id.service';

@Module({
  imports: [],
  controllers: [ProfileController],
  providers: [FindPlaylistHrefTracksByIdService, CompareProfilesByIdService],
})
export class AppModule {}
