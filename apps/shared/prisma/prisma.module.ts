import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@Apps/shared/prisma/services/prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
