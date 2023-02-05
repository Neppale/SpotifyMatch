import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { FindPlaylistIdsByUserIdService } from 'src/playlist/services/find-playlist-ids-by-user-id.service';
import { CompareProfilesByIdService } from './services/compare-profiles-by-id.service';
import { GetAccessTokenService } from 'src/utils/auth/services/get-access-token.service';

@Module({
  imports: [],
  controllers: [ProfileController],
  providers: [
    FindPlaylistIdsByUserIdService,
    CompareProfilesByIdService,
    GetAccessTokenService,
  ],
})
export class AppModule {}
