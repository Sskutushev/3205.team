import { NestFactory } from '@nestjs/core';
import { configureApp } from './common/configure-app.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(3000);
}

void bootstrap();
