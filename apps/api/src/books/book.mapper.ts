import { Author, Book, Genre, Publisher } from '@prisma/client';

export type BookWithRelations = Book & {
  author: Author;
  publisher: Publisher;
  genre: Genre;
};

export type BookResponse = {
  id: string;
  title: string;
  price: number;
  stock: number;
  available: boolean;
  imageUrl: string | null;
  author: { id: string; name: string };
  publisher: { id: string; name: string };
  genre: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export const bookInclude = { author: true, publisher: true, genre: true } as const;

export function toBookResponse(book: BookWithRelations): BookResponse {
  return {
    id: book.id,
    title: book.title,
    price: Number(book.price),
    stock: book.stock,
    available: book.available,
    imageUrl: book.imagePath,
    author: { id: book.author.id, name: book.author.name },
    publisher: { id: book.publisher.id, name: book.publisher.name },
    genre: { id: book.genre.id, name: book.genre.name },
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
  };
}
