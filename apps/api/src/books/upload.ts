import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { memoryStorage } from 'multer';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function imageFileFilter(
  _req: unknown,
  file: { mimetype: string },
  callback: (error: Error | null, accept: boolean) => void,
) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    callback(new BadRequestException('La imagen debe ser JPG, PNG o WEBP'), false);
    return;
  }
  callback(null, true);
}

export const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
};

export const diskImageUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      const dir = process.env.UPLOAD_DIR || 'uploads';
      mkdirSync(dir, { recursive: true });
      callback(null, dir);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
};
