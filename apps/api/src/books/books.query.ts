import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const SORT_FIELDS = ['title', 'price', 'stock', 'available', 'createdAt', 'author', 'publisher', 'genre'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export type BookListParams = {
  page?: number;
  limit?: number;
  search?: string;
  genreId?: string;
  publisherId?: string;
  authorId?: string;
  available?: boolean;
  sort?: string;
};

export function parseSort(sort?: string): Prisma.BookOrderByWithRelationInput[] {
  if (!sort?.trim()) return [{ createdAt: 'desc' }];

  const parts = sort.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 3) {
    throw new BadRequestException('Se permiten hasta 3 criterios de orden');
  }

  return parts.map((part) => {
    const [field, direction] = part.split(':');
    if (!SORT_FIELDS.includes(field as SortField) || (direction !== 'asc' && direction !== 'desc')) {
      throw new BadRequestException(`Orden inválido: ${part}`);
    }
    if (field === 'author') return { author: { name: direction } };
    if (field === 'publisher') return { publisher: { name: direction } };
    if (field === 'genre') return { genre: { name: direction } };
    return { [field]: direction };
  });
}

export function buildBookWhere(params: BookListParams): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = { deletedAt: null };
  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { name: { contains: search, mode: 'insensitive' } } },
      { publisher: { name: { contains: search, mode: 'insensitive' } } },
      { genre: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (params.authorId) where.authorId = params.authorId;
  if (params.publisherId) where.publisherId = params.publisherId;
  if (params.genreId) where.genreId = params.genreId;
  if (typeof params.available === 'boolean') where.available = params.available;
  return where;
}

export function pagination(page = 1, limit = 10) {
  const safeLimit = Math.min(Math.max(limit || 10, 1), 50);
  const safePage = Math.max(page || 1, 1);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}
