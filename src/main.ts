import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { returnAllRoles } from './decorators/roles/role.enum';
import { HttpExceptionFilter } from './error';
import { BadRequestException } from './error/bad-request-error';
import { loggerMiddleware } from './logger/logger.service';

dotenv.config({
  path: `.env`,
});
async function bootstrap() {
  console.log('roles', returnAllRoles());
  console.log('MONGODB_URI', process.env.MONGODB_URI);
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());

  app.enableCors({
    origin: (origin, callback) => {
      console.log('origin', origin);
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3003',
        'https://your-prod-url.com',
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow the origin
      } else {
        callback(new ForbiddenException('Not allowed by CORS'), false); // Deny the origin
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const firstError = Object.values(validationErrors[0].constraints)[0];
        return new BadRequestException(firstError);
      },
    }),
  );

  app.use(loggerMiddleware);

  const configService = app.get<ConfigService>(ConfigService);
  const options = new DocumentBuilder()
    .setTitle('Media API')
    .setDescription('The Media API description')
    .setVersion('1.0')
    .addServer(
      configService.get('SWAGGER_SERVER_URL'),
      configService.get('SWAGGER_SERVER_ENVIRONMENT'),
    )

    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);
  await app.listen(3003);
}
bootstrap();
