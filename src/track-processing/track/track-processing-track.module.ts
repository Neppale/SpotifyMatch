import { Module } from '@nestjs/common';
import { PrismaModule } from '@Prisma/prisma.module';
import { AuthModule } from '@Utils/auth/auth.module';
import { TrackRepository } from '@Tracks/repositories/track.repository';
import { TrackService } from '@Tracks/services/track.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [TrackRepository, TrackService],
  exports: [TrackRepository, TrackService],
})
export class TrackProcessingTrackModule {}
