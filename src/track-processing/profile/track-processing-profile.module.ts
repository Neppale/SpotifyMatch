import { Module } from '@nestjs/common';
import { PrismaModule } from '@Prisma/prisma.module';
import { ProfileRepository } from '@Profile/services/profile.repository';

@Module({
  imports: [PrismaModule],
  providers: [ProfileRepository],
  exports: [ProfileRepository],
})
export class TrackProcessingProfileModule {}

