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
import cookieParser from 'cookie-parser';

dotenv.config({
  path: `.env`,
});
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());
  console.log('dev');

  app.enableCors({
    origin: (origin, callback) => {
      console.log('origin', origin);

      callback(null, true); // Allow the origin
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
  await app.listen(process.env.PORT);
}
bootstrap();
