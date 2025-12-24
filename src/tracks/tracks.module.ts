import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrackRepository } from './repositories/track.repository';

@Module({
  imports: [PrismaModule],
  providers: [TrackRepository],
  exports: [TrackRepository],
})
export class TracksModule {}
