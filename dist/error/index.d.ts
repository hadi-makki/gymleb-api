import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { ExceptionDto } from './exception-dto';
export declare class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): ExceptionDto;
}
