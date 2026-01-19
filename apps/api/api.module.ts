import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core/constants';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { FlagsmithModule } from '@Apps/shared/flagsmith/flagsmith.module';
import { RedisModule } from '@Apps/shared/redis/redis.module';
import { ProfileModule } from '@Apps/api/profile/profile.module';
import { AuthModule } from '@Utils/auth/auth.module';
import { ClientsUnavailableExceptionHandler } from '@Apps/track-processing/handlers/clients-unavailable-exception.handler';
import { ApiController } from '@Apps/api/controllers/api.controller';
import { ClientsModule } from '@Apps/api/clients/clients.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    PrismaModule,
    FlagsmithModule,
    RedisModule,
    AuthModule,
    ProfileModule,
    ClientsModule,
  ],
  controllers: [ApiController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ClientsUnavailableExceptionHandler,
    {
      provide: APP_FILTER,
      useClass: ClientsUnavailableExceptionHandler,
    },
  ],
})
export class ApiModule {}
