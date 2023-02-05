import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { FindPlaylistIdsByUserIdService } from 'src/playlist/services/find-playlist-ids-by-user-id.service';
import { CompareProfilesByIdService } from './services/compare-profiles-by-id.service';
import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';
import { FindPlaylistTracksByIdService } from 'src/playlist/services/find-playlist-tracks-by-id.service';
import { ValidateSimilarTracksService } from 'src/tracks/services/validate-similar-tracks.service';

@Module({
  imports: [],
  controllers: [ProfileController],
  providers: [
    FindPlaylistIdsByUserIdService,
    CompareProfilesByIdService,
    GetAccessTokenService,
    FindPlaylistTracksByIdService,
    ValidateSimilarTracksService,
  ],
})
export class AppModule {}
