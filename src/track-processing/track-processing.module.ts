import { Module } from '@nestjs/common';
import { TrackProcessingController } from './track-processing.controller';
import { TrackProcessingService } from './services/track-processing.service';
import { TrackProcessingTrackModule } from './track/track-processing-track.module';
import { TrackProcessingProfileModule } from './profile/track-processing-profile.module';
import { AuthModule } from '@Utils/auth/auth.module';
import { PrismaModule } from '@Prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    TrackProcessingTrackModule,
    TrackProcessingProfileModule,
    AuthModule,
  ],
  controllers: [TrackProcessingController],
  providers: [TrackProcessingService],
})
export class TrackProcessingModule {}
