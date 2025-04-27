"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnAllRoles = exports.Role = void 0;
var Role;
(function (Role) {
    Role["Any"] = "any";
    Role["SuperAdmin"] = "super-admin";
    Role["ReadUsers"] = "read:users";
    Role["WriteUsers"] = "write:users";
    Role["ReadPersonalTrainers"] = "read:personal-trainers";
    Role["WritePersonalTrainers"] = "write:personal-trainers";
    Role["ReadGymOwners"] = "read:gym-owners";
    Role["WriteGymOwners"] = "write:gym-owners";
    Role["ReadGyms"] = "read:gyms";
    Role["WriteGyms"] = "write:gyms";
    Role["GymOwner"] = "gym-owner";
})(Role || (exports.Role = Role = {}));
const returnAllRoles = () => {
    return Object.values(Role);
};
exports.returnAllRoles = returnAllRoles;
//# sourceMappingURL=role.enum.js.map