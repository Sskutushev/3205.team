import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';

export function configureApp(app: INestApplication): void {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}
