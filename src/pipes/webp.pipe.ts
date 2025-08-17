import { Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import sharp from 'sharp';
import convert from 'heic-convert';

@Injectable()
export class WebpPipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  async transform(image: Express.Multer.File): Promise<Express.Multer.File> {
    if (!image?.mimetype?.startsWith('image/')) return image;
    const transformedImage = await sharp(
      !image.originalname.endsWith('.heic')
        ? Buffer.from(image.buffer)
        : Buffer.from(
            await convert({
              buffer: Buffer.from(image.buffer) as unknown as ArrayBuffer,
              format: 'PNG',
            }),
          ),
    )
      .toFormat('webp')
      .toBuffer();

    return {
      ...image,
      buffer: transformedImage,
      mimetype: 'image/webp',
      size: Buffer.byteLength(transformedImage),
      filename:
        path.basename(image.originalname, path.extname(image.originalname)) +
        '.webp',
    };
  }
}
