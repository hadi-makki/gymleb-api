import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { ExceptionDto } from './exception-dto';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse: any = exception.getResponse();
    const status = exception.getStatus();

    let message = exception.message;
    if (exceptionResponse && exceptionResponse.message) {
      // Check if the message is an array and join it to form a single string
      if (Array.isArray(exceptionResponse.message)) {
        message = exceptionResponse.message.join(', ');
      } else {
        message = exceptionResponse.message;
      }
    }

    let errorResponse = new ExceptionDto();
    errorResponse.message = message;
    errorResponse.timestamp = new Date();
    errorResponse.path = request.url;

    response.status(status).json(errorResponse);
  }
}
