"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalEnv = isLocalEnv;
exports.isUsingLocalNetwork = isUsingLocalNetwork;
function isLocalEnv() {
    return process.env.NODE_ENV.includes('local');
}
function isUsingLocalNetwork() {
    return process.env.NODE_ENV.includes('ali-local');
}
//# sourceMappingURL=helper-functions.js.map