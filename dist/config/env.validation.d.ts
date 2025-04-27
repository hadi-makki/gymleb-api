declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test",
    Provision = "provision",
    Local = "local",
    AliLocal = "ali-local"
}
declare class EnvironmentVariables {
    NODE_ENV: Environment;
    PORT: number;
    TCP_HOST: string;
    TCP_PORT: number;
    KAFKA_BROKER: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_ACCESS_KEY_ID: string;
    S3_BUCKET: string;
    S3_REGION: string;
    SWAGGER_SERVER_URL: string;
    SWAGGER_SERVER_ENVIRONMENT: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
