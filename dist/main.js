"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const dotenv = require("dotenv");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const role_enum_1 = require("./decorators/roles/role.enum");
const error_1 = require("./error");
const bad_request_error_1 = require("./error/bad-request-error");
const logger_service_1 = require("./logger/logger.service");
const cookieParser = require("cookie-parser");
dotenv.config({
    path: `.env`,
});
async function bootstrap() {
    console.log('roles', (0, role_enum_1.returnAllRoles)());
    console.log('MONGODB_URI', process.env.MONGODB_URI);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.useGlobalFilters(new error_1.HttpExceptionFilter());
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: (origin, callback) => {
            console.log('origin', origin);
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3003',
                'https://your-prod-url.com',
                'http://176.57.188.91:3003',
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new common_1.ForbiddenException('Not allowed by CORS'), false);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        exceptionFactory: (validationErrors = []) => {
            const firstError = Object.values(validationErrors[0].constraints)[0];
            return new bad_request_error_1.BadRequestException(firstError);
        },
    }));
    app.use(logger_service_1.loggerMiddleware);
    const configService = app.get(config_1.ConfigService);
    const options = new swagger_1.DocumentBuilder()
        .setTitle('Media API')
        .setDescription('The Media API description')
        .setVersion('1.0')
        .addServer(configService.get('SWAGGER_SERVER_URL'), configService.get('SWAGGER_SERVER_ENVIRONMENT'))
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, options);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    await app.listen(3003);
}
bootstrap();
//# sourceMappingURL=main.js.map