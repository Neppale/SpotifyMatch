import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core/constants';
import { PrismaModule } from '@Apps/shared/prisma/prisma.module';
import { FlagsmithModule } from '@Apps/shared/flagsmith/flagsmith.module';
import { ProfileModule } from '@Apps/api/profile/profile.module';
import { AuthModule } from '@Utils/auth/auth.module';

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
    AuthModule,
    ProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiModule {}
