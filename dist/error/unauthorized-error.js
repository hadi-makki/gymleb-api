"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = void 0;
const common_1 = require("@nestjs/common");
class UnauthorizedException extends common_1.HttpException {
    constructor(message) {
        if (message && Array.isArray(message)) {
            const flatMessage = message.join(', ');
            message = flatMessage;
        }
        super(message, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedException = UnauthorizedException;
//# sourceMappingURL=unauthorized-error.js.map