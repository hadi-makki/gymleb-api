"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const s3_service_1 = require("../s3/s3.service");
const token_entity_1 = require("../token/token.entity");
const user_entity_1 = require("../user/user.entity");
const user_service_1 = require("../user/user.service");
const media_controller_1 = require("./media.controller");
const media_entity_1 = require("./media.entity");
const media_service_1 = require("./media.service");
let MediaModule = class MediaModule {
};
exports.MediaModule = MediaModule;
exports.MediaModule = MediaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: media_entity_1.Media.name, schema: media_entity_1.MediaSchema },
                { name: user_entity_1.User.name, schema: user_entity_1.UserSchema },
                { name: token_entity_1.default.name, schema: token_entity_1.TokenSchema },
            ]),
        ],
        controllers: [media_controller_1.MediaController],
        providers: [media_service_1.MediaService, s3_service_1.S3Service, config_1.ConfigService, user_service_1.UserService],
    })
], MediaModule);
//# sourceMappingURL=media.module.js.map