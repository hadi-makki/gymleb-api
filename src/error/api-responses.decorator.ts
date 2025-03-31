import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse as ApiBadRequestResponseDefault,
  ApiForbiddenResponse as ApiForbiddenResponseDefault,
  ApiInternalServerErrorResponse as ApiInternalServerErrorResponseDefault,
  ApiNotFoundResponse as ApiNotFoundResponseDefault,
  ApiUnauthorizedResponse as ApiUnauthorizedResponseDefault,
} from '@nestjs/swagger';

import { ExceptionDto } from './exception-dto';

export function ApiInternalServerErrorResponse(description?: string) {
  return applyDecorators(
    ApiInternalServerErrorResponseDefault({
      type: ExceptionDto,
      description: description || 'Internal server error',
    }),
  );
}

export function ApiBadRequestResponse(description?: string) {
  return applyDecorators(
    ApiBadRequestResponseDefault({
      type: ExceptionDto,
      description: description || 'Bad request',
    }),
  );
}

export function ApiUnauthorizedResponse(description?: string) {
  return applyDecorators(
    ApiUnauthorizedResponseDefault({
      type: ExceptionDto,
      description: description || 'Unauthorized',
    }),
  );
}

export function ApiForbiddenResponse(description?: string) {
  return applyDecorators(
    ApiForbiddenResponseDefault({
      type: ExceptionDto,
      description: description || 'Forbidden',
    }),
  );
}

export function ApiNotFoundResponse(description?: string) {
  return applyDecorators(
    ApiNotFoundResponseDefault({
      type: ExceptionDto,
      description: description || 'Not found',
    }),
  );
}
