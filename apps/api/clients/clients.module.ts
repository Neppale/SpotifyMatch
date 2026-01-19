import { Module } from '@nestjs/common';
import { ClientService } from './services/client.service';
import { ClientController } from './controllers/client.controller';
import { FlagsmithModule } from '@Apps/shared/flagsmith/flagsmith.module';
import { RedisModule } from '@Apps/shared/redis/redis.module';

@Module({
  imports: [FlagsmithModule, RedisModule],
  providers: [ClientService],
  controllers: [ClientController],
  exports: [ClientService],
})
export class ClientsModule {}
