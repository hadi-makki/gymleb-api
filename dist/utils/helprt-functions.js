"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnUser = void 0;
const returnUser = (user) => {
    const { password, ...restUser } = user;
    return restUser;
};
exports.returnUser = returnUser;
//# sourceMappingURL=helprt-functions.js.map