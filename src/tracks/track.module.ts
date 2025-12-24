import { Module } from '@nestjs/common';
import { PrismaModule } from '@Prisma/prisma.module';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { TrackService } from '@Tracks/services/track.service';
import { GetAccessTokenService } from '@Utils/auth/services/get-access-token.service';

@Module({
  imports: [PrismaModule],
  providers: [TrackRepository, TrackService, GetAccessTokenService],
  exports: [TrackRepository, TrackService],
})
export class TrackModule {}
