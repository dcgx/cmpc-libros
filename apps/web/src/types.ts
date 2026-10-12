export type NamedRef = { id: string; name: string; _count?: { books: number } };

export type Book = {
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

export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

export type SortField = 'title' | 'price' | 'stock' | 'available' | 'createdAt' | 'author' | 'publisher' | 'genre';

export type BookQuery = {
  page: number;
  limit: number;
  search: string;
  genreId: string;
  publisherId: string;
  authorId: string;
  available: '' | 'true' | 'false';
  primarySort: SortField;
  primaryDir: 'asc' | 'desc';
  secondarySort: '' | SortField;
  secondaryDir: 'asc' | 'desc';
};

export const emptyQuery: BookQuery = {
  page: 1,
  limit: 10,
  search: '',
  genreId: '',
  publisherId: '',
  authorId: '',
  available: '',
  primarySort: 'createdAt',
  primaryDir: 'desc',
  secondarySort: '',
  secondaryDir: 'asc',
};
