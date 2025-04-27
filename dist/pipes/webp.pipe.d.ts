import { PipeTransform } from '@nestjs/common';
export declare class WebpPipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>> {
    transform(image: Express.Multer.File): Promise<Express.Multer.File>;
}
