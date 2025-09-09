import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isPhoneNumber, ValidationError } from 'class-validator';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { returnAllRoles } from './decorators/roles/role.enum';
import { HttpExceptionFilter } from './error';
import { BadRequestException } from './error/bad-request-error';
import { loggerMiddleware } from './logger/logger.service';
import cookieParser from 'cookie-parser';
import { NextFunction } from 'express';
import { Request } from 'express';
import { Response } from 'express';
import { isValidPhoneUsingISO } from './utils/validations';

dotenv.config({
  path: `.env`,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  console.log('check phone number', isValidPhoneUsingISO('+96179341209', 'LB'));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());

  // Rate limiting is configured globally in AppModule with ThrottlerModule
  // Current configuration: 100 requests per minute per IP

  app.enableCors({
    origin: (origin, callback) => {
      callback(null, true); // Allow the origin
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const firstError = Object.values(validationErrors[0].constraints)[0];
        return new BadRequestException(firstError);
      },
    }),
  );

  app.use(loggerMiddleware);

  const configService = app.get<ConfigService>(ConfigService);

  // Swagger password protection
  app.use('/swagger*', (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');

    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
      return res.status(401).send('Authentication required');
    }

    const credentials = Buffer.from(auth.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');

    if (username === 'admin' && password === swaggerPassword) {
      return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
    return res.status(401).send('Invalid credentials');
  });
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
  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'GymLeb API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  await app.listen(process.env.PORT);
}
bootstrap();
