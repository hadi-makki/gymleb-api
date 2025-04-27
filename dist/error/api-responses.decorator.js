"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiInternalServerErrorResponse = ApiInternalServerErrorResponse;
exports.ApiBadRequestResponse = ApiBadRequestResponse;
exports.ApiUnauthorizedResponse = ApiUnauthorizedResponse;
exports.ApiForbiddenResponse = ApiForbiddenResponse;
exports.ApiNotFoundResponse = ApiNotFoundResponse;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exception_dto_1 = require("./exception-dto");
function ApiInternalServerErrorResponse(description) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiInternalServerErrorResponse)({
        type: exception_dto_1.ExceptionDto,
        description: description || 'Internal server error',
    }));
}
function ApiBadRequestResponse(description) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiBadRequestResponse)({
        type: exception_dto_1.ExceptionDto,
        description: description || 'Bad request',
    }));
}
function ApiUnauthorizedResponse(description) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiUnauthorizedResponse)({
        type: exception_dto_1.ExceptionDto,
        description: description || 'Unauthorized',
    }));
}
function ApiForbiddenResponse(description) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiForbiddenResponse)({
        type: exception_dto_1.ExceptionDto,
        description: description || 'Forbidden',
    }));
}
function ApiNotFoundResponse(description) {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiNotFoundResponse)({
        type: exception_dto_1.ExceptionDto,
        description: description || 'Not found',
    }));
}
//# sourceMappingURL=api-responses.decorator.js.map