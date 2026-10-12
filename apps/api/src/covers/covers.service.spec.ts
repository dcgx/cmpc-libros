import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CoversService } from './covers.service';
import { blankToUndefined } from './dto/find-cover.dto';

const ISBN = '9780140328721';

function jpeg(size = 500): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(size, 7)]);
}

function png(): Buffer {
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(500, 3)]);
}

function webp(): Buffer {
  const body = Buffer.alloc(500, 4);
  Buffer.from('RIFF').copy(body, 0);
  Buffer.from('WEBP').copy(body, 8);
  return body;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function imageResponse(body: Buffer, status = 200): Response {
  return new Response(new Uint8Array(body), { status, headers: { 'content-type': 'image/jpeg' } });
}

function serviceWith(handler: (url: string) => Response | Promise<Response>) {
  const http = jest.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url);
  });
  return { service: new CoversService(http), urls: () => http.mock.calls.map((call) => String(call[0])) };
}

describe('blankToUndefined', () => {
  it('descarta espacios y conserva el resto', () => {
    expect(blankToUndefined('  ')).toBeUndefined();
    expect(blankToUndefined(' Rayuela ')).toBe('Rayuela');
    expect(blankToUndefined(1)).toBe(1);
  });
});

describe('CoversService', () => {
  it('exige ISBN o título', async () => {
    const { service } = serviceWith(() => jsonResponse({}));
    await expect(service.find({})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un ISBN inválido', async () => {
    const { service } = serviceWith(() => jsonResponse({}));
    await expect(service.find({ isbn: '123' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un título de un carácter si no hay ISBN', async () => {
    const { service } = serviceWith(() => jsonResponse({}));
    await expect(service.find({ title: ' A ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('devuelve la carátula directa de Open Library', async () => {
    const { service, urls } = serviceWith((url) => {
      if (url.includes('/b/isbn/')) return imageResponse(jpeg());
      return jsonResponse({}, 404);
    });

    const cover = await service.find({ isbn: '978-0-14-032872-1', title: 'El hobbit' });

    expect(cover.source).toBe('openlibrary');
    expect(cover.isbn).toBe(ISBN);
    expect(cover.title).toBe('El hobbit');
    expect(cover.contentType).toBe('image/jpeg');
    expect(Buffer.from(cover.imageBase64, 'base64')[0]).toBe(0xff);
    expect(urls().some((url) => url.includes('search.json'))).toBe(false);
  });

  it('sigue con la búsqueda de Open Library si la carátula por ISBN no sirve', async () => {
    const { service } = serviceWith((url) => {
      if (url.includes('/b/isbn/')) return imageResponse(jpeg(10));
      if (url.includes('search.json') && url.includes('isbn=')) {
        return jsonResponse({ docs: [{ title: 'Sin tapa', cover_i: 0 }] });
      }
      if (url.includes('search.json')) {
        return jsonResponse({ docs: [{ title: 'Rayuela', cover_i: 42, isbn: ['9780140328721'] }] });
      }
      if (url.includes('/b/id/42')) return imageResponse(png());
      return jsonResponse({}, 404);
    });

    const cover = await service.find({ isbn: ISBN, title: 'Rayuela' });

    expect(cover.source).toBe('openlibrary');
    expect(cover.title).toBe('Rayuela');
    expect(cover.contentType).toBe('image/png');
  });

  it('busca solo por título en Open Library', async () => {
    const { service, urls } = serviceWith((url) => {
      if (url.includes('search.json')) {
        return jsonResponse({ docs: [{ title: 'Rayuela', cover_i: 7, isbn: ['9780140328721'] }] });
      }
      if (url.includes('/b/id/7')) return imageResponse(webp());
      return jsonResponse({}, 404);
    });

    const cover = await service.find({ title: '  Rayuela   Cortázar  ' });

    expect(cover.contentType).toBe('image/webp');
    expect(cover.title).toBe('Rayuela');
    expect(urls().some((url) => url.includes('/b/isbn/'))).toBe(false);
    expect(urls().some((url) => url.includes('title=Rayuela+Cort%C3%A1zar'))).toBe(true);
  });

  it('responde 404 si Open Library no tiene carátula', async () => {
    const { service, urls } = serviceWith((url) => {
      if (url.includes('search.json')) return jsonResponse({ docs: [{ title: 'Sin tapa' }] });
      return jsonResponse({}, 404);
    });

    await expect(service.find({ isbn: ISBN, title: 'Rayuela' })).rejects.toBeInstanceOf(NotFoundException);
    expect(urls().every((url) => url.includes('openlibrary.org'))).toBe(true);
  });

  it('responde 404 si ninguna fuente tiene carátula', async () => {
    const { service } = serviceWith((url) => {
      if (url.includes('search.json')) throw new Error('red');
      return jsonResponse({}, 404);
    });
    await expect(service.find({ title: 'Inexistente' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
