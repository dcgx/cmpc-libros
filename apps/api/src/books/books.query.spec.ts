import { BadRequestException } from '@nestjs/common';
import { buildBookWhere, pagination, parseSort } from './books.query';

describe('parseSort', () => {
  it('usa fecha descendente por defecto', () => {
    expect(parseSort()).toEqual([{ createdAt: 'desc' }]);
  });

  it('acepta varios campos', () => {
    expect(parseSort('price:desc,author:asc')).toEqual([
      { price: 'desc' },
      { author: { name: 'asc' } },
    ]);
  });

  it('rechaza un campo desconocido', () => {
    expect(() => parseSort('foo:asc')).toThrow(BadRequestException);
  });
});

describe('buildBookWhere', () => {
  it('excluye eliminados y aplica filtros', () => {
    expect(buildBookWhere({ search: 'neruda', available: true, authorId: 'a' })).toMatchObject({
      deletedAt: null,
      available: true,
      authorId: 'a',
    });
  });
});

describe('pagination', () => {
  it('limita el tamaño de página', () => {
    expect(pagination(2, 100)).toMatchObject({ page: 2, limit: 50, skip: 50 });
  });
});
