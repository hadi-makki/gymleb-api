"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const role_enum_1 = require("./role.enum");
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, [...roles, role_enum_1.Role.SuperAdmin]);
exports.Roles = Roles;
//# sourceMappingURL=Role.js.map