import { Global, Module } from '@nestjs/common';
import { FlagsmithService } from './services/flagsmith.service';

@Global()
@Module({
  providers: [FlagsmithService],
  exports: [FlagsmithService],
})
export class FlagsmithModule {}
