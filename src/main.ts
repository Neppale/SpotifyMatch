import { NestFactory } from '@nestjs/core';
import { AppModule } from './profile/app.module';
import * as dotenv from 'dotenv';
import { AxiosExceptionFilter } from './utils/filters/axios-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AxiosExceptionFilter());
  await app.listen(3000);
}
bootstrap();
