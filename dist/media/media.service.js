"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const axios_1 = require("axios");
const mongoose_2 = require("mongoose");
const s3_service_1 = require("../s3/s3.service");
const user_service_1 = require("../user/user.service");
const uuid_1 = require("uuid");
const media_entity_1 = require("./media.entity");
let MediaService = class MediaService {
    constructor(mediaRepository, s3Service, usersService) {
        this.mediaRepository = mediaRepository;
        this.s3Service = s3Service;
        this.usersService = usersService;
    }
    async upload(file, userId = null) {
        const checkUser = await this.usersService.checkUserExists(userId);
        if (!checkUser) {
            throw new common_1.NotFoundException('User not found in media service');
        }
        const bufferLength = file.buffer.length || file.buffer.data.length;
        if (!bufferLength) {
            throw new common_1.BadRequestException('File buffer is empty');
        }
        const extension = file.originalname.split('.').pop();
        const key = (0, uuid_1.v4)() + '.' + extension;
        const media = this.mediaRepository.create({
            s3Key: key,
            originalName: file.originalname,
            fileName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            userId: userId,
        });
        const newMedia = await this.mediaRepository.create(media);
        await this.s3Service.uploadFile(file, key);
        return {
            id: newMedia.id,
        };
    }
    async delete(id) {
        try {
            console.log(`Deleting media with ID: ${id}`);
            if (!(0, uuid_1.validate)(id)) {
                throw new common_1.BadRequestException('Invalid UUID format');
            }
            const media = await this.mediaRepository.findOne({ id });
            if (!media) {
                throw new common_1.NotFoundException('Media not found');
            }
            console.log(`Found media: ${JSON.stringify(media)}`);
            await this.s3Service.deleteFile(media.s3Key);
            await this.mediaRepository.deleteOne({ id });
            console.log(`Successfully deleted media with ID: ${id}`);
        }
        catch (err) {
            throw new common_1.BadRequestException('error in deleting the message ' + err);
        }
    }
    async getFileById(id) {
        const media = await this.mediaRepository.findOne({ id });
        if (!media) {
            throw new common_1.NotFoundException('Media not found');
        }
        return media;
    }
    async getFileStreamById(id, res) {
        const media = await this.mediaRepository.findOne({ id });
        if (!media) {
            throw new common_1.NotFoundException('Media not found');
        }
        res.setHeader('Content-Type', media.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${media.originalName}"`);
        return this.s3Service.getFile(media.s3Key);
    }
    async uploadUrl(url, userId) {
        console.log('uploadUrl', url, userId);
        const multerFile = await this.urlToMulter(url);
        return await this.upload(multerFile, userId);
    }
    async urlToMulter(url) {
        const response = await axios_1.default.get(url, {
            responseType: 'arraybuffer',
        });
        return {
            originalname: url,
            mimetype: response.headers['content-type'],
            size: response.data.byteLength,
            buffer: Buffer.from(response.data),
            fieldname: 'file',
            stream: null,
            destination: '',
            filename: '',
            path: '',
            encoding: '',
        };
    }
    async getS3Url(id, userId = null) {
        const media = await this.mediaRepository.findOne({ id: id.toString() });
        if (!media || (userId && media.user.id !== userId)) {
            throw new common_1.NotFoundException('Media not found');
        }
        return { url: await this.s3Service.getS3Url(media.s3Key) };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(media_entity_1.Media.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        s3_service_1.S3Service,
        user_service_1.UserService])
], MediaService);
//# sourceMappingURL=media.service.js.map