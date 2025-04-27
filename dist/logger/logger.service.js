"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = loggerMiddleware;
const common_1 = require("@nestjs/common");
function loggerMiddleware(req, res, next) {
    const { method, url } = req;
    const start = Date.now();
    const getColor = (statusCode) => {
        if (statusCode >= 500)
            return '\x1b[31m';
        if (statusCode >= 400)
            return '\x1b[33m';
        if (statusCode >= 300)
            return '\x1b[36m';
        if (statusCode >= 200)
            return '\x1b[32m';
        return '\x1b[37m';
    };
    const { statusCode } = res;
    const duration = Date.now() - start;
    const color = getColor(statusCode);
    common_1.Logger.log(`${color}${method} ${url} ${statusCode} - ${duration}ms\x1b[0m`);
    next();
}
//# sourceMappingURL=logger.service.js.map