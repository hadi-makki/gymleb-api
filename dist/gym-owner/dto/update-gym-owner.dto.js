"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGymOwnerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_gym_owner_dto_1 = require("./create-gym-owner.dto");
class UpdateGymOwnerDto extends (0, swagger_1.PartialType)(create_gym_owner_dto_1.CreateGymOwnerDto) {
}
exports.UpdateGymOwnerDto = UpdateGymOwnerDto;
//# sourceMappingURL=update-gym-owner.dto.js.map