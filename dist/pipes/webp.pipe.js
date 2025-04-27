"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebpPipe = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const sharp_1 = require("sharp");
const heic_convert_1 = require("heic-convert");
let WebpPipe = class WebpPipe {
    async transform(image) {
        if (!image.mimetype.startsWith('image/'))
            return image;
        const transformedImage = await (0, sharp_1.default)(!image.originalname.endsWith('.heic')
            ? Buffer.from(image.buffer)
            : Buffer.from(await (0, heic_convert_1.default)({
                buffer: Buffer.from(image.buffer),
                format: 'PNG',
            })))
            .toFormat('webp')
            .toBuffer();
        return {
            ...image,
            buffer: transformedImage,
            mimetype: 'image/webp',
            size: Buffer.byteLength(transformedImage),
            filename: path.basename(image.originalname, path.extname(image.originalname)) +
                '.webp',
        };
    }
};
exports.WebpPipe = WebpPipe;
exports.WebpPipe = WebpPipe = __decorate([
    (0, common_1.Injectable)()
], WebpPipe);
//# sourceMappingURL=webp.pipe.js.map