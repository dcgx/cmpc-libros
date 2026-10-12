import { bookSchema, loginSchema } from './validation';

describe('bookSchema', () => {
  it('acepta un libro válido', () => {
    const parsed = bookSchema.parse({
      title: 'Rayuela',
      authorName: 'Julio Cortázar',
      publisherName: 'Sudamericana',
      genreName: 'Novela',
      price: '16990',
      stock: '4',
      available: 'true',
    });
    expect(parsed.price).toBe(16990);
  });

  it('rechaza título corto', () => {
    const result = bookSchema.safeParse({
      title: 'A',
      authorName: 'Autor',
      publisherName: 'Planeta',
      genreName: 'Cuento',
      price: 10,
      stock: 1,
      available: 'false',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('exige correo y contraseña', () => {
    expect(loginSchema.safeParse({ email: 'no', password: '123' }).success).toBe(false);
  });
});
