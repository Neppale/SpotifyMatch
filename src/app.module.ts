import { CacheModule, Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core/constants';
import { CacheService } from '@Utils/cache/services/cache.service';
import { PrismaModule } from '@Prisma/prisma.module';
import { ProfileModule } from '@Profile/profile.module';
import { AuthModule } from '@Utils/auth/auth.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    CacheModule.register({
      ttl: 60,
      max: 100,
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
  ],
  providers: [
    CacheService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
