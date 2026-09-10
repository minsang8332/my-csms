import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1/api');
  // Listening on 8080 as requested
  await app.listen(8080);
  console.log('CSMS API is running on: http://localhost:8080');
}
bootstrap();
