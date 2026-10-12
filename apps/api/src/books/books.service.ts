import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { normalizeName } from '../common/text';
import { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, UploadedImage } from '../storage/storage.service';
import { bookInclude, BookWithRelations, toBookResponse } from './book.mapper';
import { booksToCsv } from './books.csv';
import { BookListParams, buildBookWhere, pagination, parseSort } from './books.query';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

type NamedDelegate = {
  findFirst: (args: {
    where: { name: { equals: string; mode: 'insensitive' } };
  }) => Promise<{ id: string; name: string } | null>;
  create: (args: { data: { name: string } }) => Promise<{ id: string; name: string }>;
};

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async list(params: BookListParams) {
    const page = pagination(params.page, params.limit);
    const where = buildBookWhere(params);
    const orderBy = parseSort(params.sort);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.book.count({ where }),
      this.prisma.book.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        include: bookInclude,
      }),
    ]);

    return {
      items: rows.map(toBookResponse),
      meta: {
        page: page.page,
        limit: page.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / page.limit)),
      },
    };
  }

  async findOne(id: string) {
    const book = await this.findActive(id);
    return toBookResponse(book);
  }

  async create(dto: CreateBookDto, file: UploadedImage | undefined, user: RequestUser, ip?: string) {
    if (!file) throw new BadRequestException('La imagen del libro es obligatoria');
    const imagePath = this.storage.save(file);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const author = await this.findOrCreate(tx.author, dto.authorName);
        const publisher = await this.findOrCreate(tx.publisher, dto.publisherName);
        const genre = await this.findOrCreate(tx.genre, dto.genreName);
        const book = await tx.book.create({
          data: {
            title: dto.title.trim(),
            price: dto.price,
            stock: dto.stock,
            available: dto.available,
            imagePath,
            authorId: author.id,
            publisherId: publisher.id,
            genreId: genre.id,
          },
          include: bookInclude,
        });
        await this.audit.record(
          {
            userId: user.id,
            action: 'BOOK_CREATED',
            entity: 'book',
            entityId: book.id,
            metadata: { title: book.title },
            ip,
          },
          tx,
        );
        return toBookResponse(book);
      });
    } catch (error) {
      this.storage.remove(imagePath);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateBookDto,
    file: UploadedImage | undefined,
    user: RequestUser,
    ip?: string,
  ) {
    const current = await this.findActive(id);
    const updated = await this.applyUpdate(current, dto, file, user, ip);
    if (file && current.imagePath && current.imagePath !== updated.imageUrl) {
      this.storage.remove(current.imagePath);
    }
    return updated;
  }

  async remove(id: string, user: RequestUser, ip?: string) {
    await this.findActive(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.book.update({ where: { id }, data: { deletedAt: new Date() } });
      await this.audit.record(
        { userId: user.id, action: 'BOOK_DELETED', entity: 'book', entityId: id, ip },
        tx,
      );
    });
    return { id };
  }

  async exportCsv(params: BookListParams, user: RequestUser, ip?: string) {
    const where = buildBookWhere(params);
    const orderBy = parseSort(params.sort);
    const rows = await this.prisma.book.findMany({
      where,
      orderBy,
      take: 10000,
      include: bookInclude,
    });
    await this.audit.record({
      userId: user.id,
      action: 'BOOK_EXPORTED',
      entity: 'book',
      metadata: { count: rows.length },
      ip,
    });
    return booksToCsv(rows.map(toBookResponse));
  }

  private async applyUpdate(
    current: BookWithRelations,
    dto: UpdateBookDto,
    file: UploadedImage | undefined,
    user: RequestUser,
    ip?: string,
  ) {
    if (!file && !this.hasChanges(dto)) {
      throw new BadRequestException('No hay cambios para guardar');
    }
    const imagePath = file ? this.storage.save(file) : undefined;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const book = await tx.book.update({
          where: { id: current.id },
          data: {
            title: dto.title?.trim(),
            price: dto.price,
            stock: dto.stock,
            available: dto.available,
            ...(imagePath ? { imagePath } : {}),
            ...(dto.authorName ? { authorId: (await this.findOrCreate(tx.author, dto.authorName)).id } : {}),
            ...(dto.publisherName ? { publisherId: (await this.findOrCreate(tx.publisher, dto.publisherName)).id } : {}),
            ...(dto.genreName ? { genreId: (await this.findOrCreate(tx.genre, dto.genreName)).id } : {}),
          },
          include: bookInclude,
        });
        await this.audit.record(
          {
            userId: user.id,
            action: 'BOOK_UPDATED',
            entity: 'book',
            entityId: book.id,
            metadata: { fields: Object.keys(dto).filter((key) => dto[key as keyof UpdateBookDto] !== undefined), imageReplaced: Boolean(file) },
            ip,
          },
          tx,
        );
        return toBookResponse(book);
      });
    } catch (error) {
      if (imagePath) this.storage.remove(imagePath);
      throw error;
    }
  }

  private hasChanges(dto: UpdateBookDto) {
    return Object.values(dto).some((value) => value !== undefined);
  }

  private async findActive(id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: bookInclude,
    });
    if (!book) throw new NotFoundException('Libro no encontrado');
    return book;
  }

  private async findOrCreate(delegate: NamedDelegate, rawName: string) {
    const name = normalizeName(rawName);
    const existing = await delegate.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) return existing;
    try {
      return await delegate.create({ data: { name } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const again = await delegate.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } },
        });
        if (again) return again;
      }
      throw error;
    }
  }
}
