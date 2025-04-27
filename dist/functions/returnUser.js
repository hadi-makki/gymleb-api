"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnUser = returnUser;
exports.returnManager = returnManager;
function returnUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function returnManager(manager) {
    return {
        id: manager.id,
        username: manager.username,
        email: manager.email,
        createdAt: manager.createdAt,
        updatedAt: manager.updatedAt,
        gym: manager.gym,
    };
}
//# sourceMappingURL=returnUser.js.map