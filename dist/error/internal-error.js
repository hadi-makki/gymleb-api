"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalErrorException = void 0;
const common_1 = require("@nestjs/common");
class InternalErrorException extends common_1.HttpException {
    constructor(message) {
        if (message && Array.isArray(message)) {
            const flatMessage = message.join(', ');
            message = flatMessage;
        }
        super(message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.InternalErrorException = InternalErrorException;
//# sourceMappingURL=internal-error.js.map