import { HttpException } from '@nestjs/common';
export declare class InternalErrorException extends HttpException {
    constructor(message: string);
}
