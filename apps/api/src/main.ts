import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ensureSeed } from './prisma/ensure-seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const uploadDir = config.get<string>('UPLOAD_DIR', 'uploads');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173').split(','),
  });
  app.setGlobalPrefix('api');
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('CMPC Libros')
      .setDescription('API de inventario de la tienda CMPC Libros')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  if (config.get<string>('SEED_ON_EMPTY', 'true') !== 'false') {
    await ensureSeed(app.get(PrismaService));
  }

  await app.listen(config.get<number>('PORT', 3000));
}

void bootstrap();
