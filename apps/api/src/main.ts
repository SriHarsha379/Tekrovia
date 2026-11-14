import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());   // needed so guard can read tekrovia_token cookie

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');

  // Fix 5: explicit origin whitelist, never reflect-all
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('SkillMove / TekRovia API')
    .setDescription('Learning-to-placement platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
