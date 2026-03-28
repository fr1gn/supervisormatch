import 'reflect-metadata';

import cookieParser from 'cookie-parser';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataStore } from './lib/data-store';
import { registerRoutes } from './lib/routes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  const store = new DataStore();
  await store.ensureDbFile();

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.json());
  registerRoutes(expressApp, store);

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`SupervisorMatch backend is running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
