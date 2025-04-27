"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestException = void 0;
const common_1 = require("@nestjs/common");
class BadRequestException extends common_1.HttpException {
    constructor(message) {
        if (message && Array.isArray(message)) {
            const flatMessage = message.join(', ');
            message = flatMessage;
        }
        super(message, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.BadRequestException = BadRequestException;
//# sourceMappingURL=bad-request-error.js.map