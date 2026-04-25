import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);
  const isProduction = configService.get('NODE_ENV') === 'production';

  app.use(json({ limit: '1mb' }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: isProduction
        ? {
            maxAge: 31_536_000,
            includeSubDomains: true,
            preload: true
          }
        : false
    })
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.app.set('trust proxy', 1);
    res.removeHeader('X-Powered-By');
    next();
  });
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  await app.listen(port);
}

void bootstrap();
