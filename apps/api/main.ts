import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import * as dotenv from 'dotenv';
import { AxiosExceptionFilter } from '@Utils/filters/axios-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  app.enableCors();
  app.useGlobalFilters(new AxiosExceptionFilter());
  await app.listen(3000);
}
bootstrap();
