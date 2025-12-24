import { Module } from '@nestjs/common';
import { PrismaModule } from '@Prisma/prisma.module';
import { TrackRepository } from '@Tracks/repositories/track.repository';

@Module({
  imports: [PrismaModule],
  providers: [TrackRepository],
  exports: [TrackRepository],
})
export class TracksModule {}
