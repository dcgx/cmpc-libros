import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
};

@Injectable()
export class StorageService {
  constructor(private readonly directory = process.env.UPLOAD_DIR || 'uploads') {}

  save(file: UploadedImage): string {
    const ext = MIME_EXT[file.mimetype];
    if (!ext) {
      throw new Error('Tipo de imagen no soportado');
    }
    mkdirSync(this.directory, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(this.directory, filename), file.buffer);
    return `/uploads/${filename}`;
  }

  remove(publicPath?: string | null) {
    if (!publicPath) return;
    const filename = basename(publicPath);
    const full = join(this.directory, filename);
    if (!full.startsWith(this.directory)) return;
    if (existsSync(full)) unlinkSync(full);
  }
}
