import { booksToCsv } from './books.csv';
import { BookResponse } from './book.mapper';

const book: BookResponse = {
  id: '1',
  title: 'Rayuela, edición',
  price: 10,
  stock: 2,
  available: true,
  imageUrl: null,
  author: { id: 'a', name: 'Cortázar' },
  publisher: { id: 'p', name: 'Sudamericana' },
  genre: { id: 'g', name: 'Novela' },
  createdAt: '',
  updatedAt: '',
};

describe('booksToCsv', () => {
  it('incluye encabezado y escapa el título', () => {
    const csv = booksToCsv([book]);
    expect(csv.split('\n')[0]).toContain('titulo');
    expect(csv).toContain('"Rayuela, edición"');
    expect(csv).toContain('Sí');
  });
});
