import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  authors() {
    return this.prisma.author.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { books: { where: { deletedAt: null } } } } },
    });
  }

  publishers() {
    return this.prisma.publisher.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { books: { where: { deletedAt: null } } } } },
    });
  }

  genres() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { books: { where: { deletedAt: null } } } } },
    });
  }
}
