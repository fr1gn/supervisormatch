import path from 'path';
import 'reflect-metadata';

import cookieParser from 'cookie-parser';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { registerRoutes } from './lib/routes';
import { registerAdminRoutes } from './lib/admin-routes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  // в docker-compose запросы идут через nginx, поэтому CORS_ORIGIN может быть '*' или конкретный домен
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()),
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  registerRoutes(expressApp);
  registerAdminRoutes(expressApp);

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`SupervisorMatch backend is running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
