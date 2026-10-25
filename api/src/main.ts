import { NestFactory } from '@nestjs/core';
import { mkdir } from 'node:fs/promises';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { mediaDirectory } from './modules/media/local-media-storage.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  await mkdir(mediaDirectory, { recursive: true });
  app.useStaticAssets(mediaDirectory, { prefix: '/media/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }
  ));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
