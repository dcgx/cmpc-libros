import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FindCoverDto } from './dto/find-cover.dto';
import { normalizeIsbn, pickIsbn } from './isbn';

export const COVER_FETCH = Symbol('COVER_FETCH');

const USER_AGENT = 'CMPC-Libros/1.0 (cover lookup)';
const MIN_IMAGE_BYTES = 400;
const IMAGE_TYPES = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

type ImageType = (typeof IMAGE_TYPES)[keyof typeof IMAGE_TYPES];

export type CoverResponse = {
  source: 'openlibrary';
  isbn: string | null;
  title: string | null;
  contentType: ImageType;
  imageBase64: string;
};

type CoverQuery = {
  isbn?: string;
  title?: string;
};

type CoverImage = {
  buffer: Buffer;
  contentType: ImageType;
};

type OpenLibraryDoc = {
  title?: string;
  cover_i?: number;
  isbn?: string[];
};

@Injectable()
export class CoversService {
  constructor(@Inject(COVER_FETCH) private readonly http: typeof fetch) {}

  async find(input: FindCoverDto): Promise<CoverResponse> {
    const query = this.parseQuery(input);
    const openLibrary = await this.fromOpenLibrary(query);
    if (openLibrary) return openLibrary;
    throw new NotFoundException('No se encontró una carátula');
  }

  private parseQuery(input: FindCoverDto): CoverQuery {
    const rawIsbn = input.isbn?.trim();
    const isbn = rawIsbn ? normalizeIsbn(rawIsbn) : undefined;
    if (rawIsbn && !isbn) throw new BadRequestException('El ISBN no es válido');

    const title = input.title?.trim().replace(/\s+/g, ' ');
    const usableTitle = title && title.length >= 2 ? title : undefined;
    if (title && !usableTitle && !isbn) {
      throw new BadRequestException('El título debe tener al menos 2 caracteres');
    }
    if (!isbn && !usableTitle) throw new BadRequestException('Indica un ISBN o un título');
    return { isbn: isbn ?? undefined, title: usableTitle };
  }

  private async fromOpenLibrary(query: CoverQuery): Promise<CoverResponse | null> {
    if (query.isbn) {
      const direct = await this.fetchImage(
        `https://covers.openlibrary.org/b/isbn/${query.isbn}-L.jpg?default=false`,
      );
      if (direct) {
        return this.toResponse(direct, query.isbn, query.title ?? null);
      }
    }

    const docs: OpenLibraryDoc[] = [];
    if (query.isbn) docs.push(...(await this.openLibraryDocs({ isbn: query.isbn })));
    if (query.title) docs.push(...(await this.openLibraryDocs({ title: query.title })));

    for (const doc of docs) {
      if (!doc.cover_i || doc.cover_i <= 0) continue;
      const image = await this.fetchImage(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`);
      if (!image) continue;
      return this.toResponse(image, pickIsbn(doc.isbn) ?? query.isbn ?? null, doc.title ?? query.title ?? null);
    }
    return null;
  }

  private async openLibraryDocs(params: { isbn?: string; title?: string }): Promise<OpenLibraryDoc[]> {
    const search = new URLSearchParams({ limit: '5', fields: 'title,cover_i,isbn' });
    if (params.isbn) search.set('isbn', params.isbn);
    if (params.title) search.set('title', params.title);
    const body = await this.fetchJson<{ docs?: OpenLibraryDoc[] }>(`https://openlibrary.org/search.json?${search}`);
    return body?.docs ?? [];
  }

  private toResponse(image: CoverImage, isbn: string | null, title: string | null): CoverResponse {
    return {
      source: 'openlibrary',
      isbn,
      title,
      contentType: image.contentType,
      imageBase64: image.buffer.toString('base64'),
    };
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const response = await this.http(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  private async fetchImage(url: string): Promise<CoverImage | null> {
    try {
      const response = await this.http(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/jpeg,image/png,image/webp' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = sniffImage(buffer);
      if (!contentType || buffer.length < MIN_IMAGE_BYTES) return null;
      return { buffer, contentType };
    } catch {
      return null;
    }
  }
}

function sniffImage(buffer: Buffer): ImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return IMAGE_TYPES.jpeg;
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return IMAGE_TYPES.png;
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return IMAGE_TYPES.webp;
  }
  return null;
}
