import { csvCell } from '../common/text';
import { BookResponse } from './book.mapper';

const HEADERS = ['titulo', 'autor', 'editorial', 'genero', 'precio', 'stock', 'disponibilidad'];

export function booksToCsv(books: BookResponse[]): string {
  const lines = [HEADERS.join(',')];
  for (const book of books) {
    lines.push(
      [
        csvCell(book.title),
        csvCell(book.author.name),
        csvCell(book.publisher.name),
        csvCell(book.genre.name),
        csvCell(book.price.toFixed(2)),
        csvCell(book.stock),
        csvCell(book.available ? 'Sí' : 'No'),
      ].join(','),
    );
  }
  return lines.join('\n');
}
