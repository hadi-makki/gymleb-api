import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
  Local = 'local',
  AliLocal = 'ali-local',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  TCP_HOST: string;

  @IsNumber()
  TCP_PORT: number;

  @IsString()
  KAFKA_BROKER: string;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_NAME: string;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  AWS_SECRET_ACCESS_KEY: string;

  @IsString()
  AWS_ACCESS_KEY_ID: string;

  @IsString()
  S3_BUCKET: string;

  @IsString()
  S3_REGION: string;

  @IsString()
  SWAGGER_SERVER_URL: string;

  @IsString()
  SWAGGER_SERVER_ENVIRONMENT: string;

  @IsString()
  UPLOADTHING_TOKEN: string;

  @IsString()
  OPENAI_API_KEY: string;

  // Firebase Cloud Messaging (FCM) - Optional (only needed if sending via FCM directly)
  @IsOptional()
  @IsString()
  FCM_SERVER_KEY_PATH?: string; // Path to FCM private key JSON file

  @IsOptional()
  @IsString()
  FCM_PROJECT_NAME?: string; // Firebase project name/ID

  // Apple Push Notification Service (APNs) - Optional (only needed if sending via APNs directly)
  @IsOptional()
  @IsString()
  APNS_KEY_PATH?: string; // Path to APNs .p8 key file

  @IsOptional()
  @IsString()
  APNS_KEY_ID?: string; // APNs key ID

  @IsOptional()
  @IsString()
  APNS_TEAM_ID?: string; // Apple Team ID

  @IsOptional()
  @IsString()
  APNS_BUNDLE_ID?: string; // iOS bundle identifier

  @IsOptional()
  @IsString()
  APNS_IS_PRODUCTION?: string; // 'true' for production, 'false' for sandbox
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true, // Allow optional FCM/APNs variables
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
