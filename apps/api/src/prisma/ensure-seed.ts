import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const BOOKS: Array<[string, string, string, string, number, number, boolean]> = [
  ['La casa de los espíritus', 'Isabel Allende', 'Sudamericana', 'Novela', 14990, 12, true],
  ['Cien años de soledad', 'Gabriel García Márquez', 'Sudamericana', 'Novela', 16990, 8, true],
  ['El amor en los tiempos del cólera', 'Gabriel García Márquez', 'Alfaguara', 'Novela', 15990, 0, false],
  ['Veinte poemas de amor y una canción desesperada', 'Pablo Neruda', 'Seix Barral', 'Poesía', 9990, 20, true],
  ['Residencia en la tierra', 'Pablo Neruda', 'Seix Barral', 'Poesía', 12990, 4, true],
  ['Desolación', 'Gabriela Mistral', 'Alfaguara', 'Poesía', 11990, 6, true],
  ['Tala', 'Gabriela Mistral', 'Planeta', 'Poesía', 10990, 2, true],
  ['2666', 'Roberto Bolaño', 'Anagrama', 'Novela', 24990, 5, true],
  ['Los detectives salvajes', 'Roberto Bolaño', 'Anagrama', 'Novela', 19990, 3, true],
  ['El obsceno pájaro de la noche', 'José Donoso', 'Alfaguara', 'Novela', 17990, 0, false],
  ['Casa de campo', 'José Donoso', 'Planeta', 'Novela', 13990, 7, true],
  ['Ficciones', 'Jorge Luis Borges', 'Sudamericana', 'Cuento', 13990, 15, true],
  ['El Aleph', 'Jorge Luis Borges', 'Sudamericana', 'Cuento', 12990, 9, true],
  ['La ciudad y los perros', 'Mario Vargas Llosa', 'Seix Barral', 'Novela', 14990, 6, true],
  ['Conversación en La Catedral', 'Mario Vargas Llosa', 'Alfaguara', 'Novela', 18990, 1, true],
  ['Pedro Páramo', 'Juan Rulfo', 'Planeta', 'Novela', 9990, 18, true],
  ['El llano en llamas', 'Juan Rulfo', 'Planeta', 'Cuento', 8990, 11, true],
  ['Rayuela', 'Julio Cortázar', 'Sudamericana', 'Novela', 16990, 4, true],
  ['Bestiario', 'Julio Cortázar', 'Anagrama', 'Cuento', 11990, 0, true],
  ['Papelucho', 'Marcela Paz', 'SM', 'Infantil', 7990, 25, true],
  ['Historia de Chile', 'Simon Collier', 'Planeta', 'Historia', 22990, 3, true],
  ['Poema de Chile', 'Gabriela Mistral', 'Penguin Random House', 'Poesía', 14990, 5, true],
  ['La literatura nazi en América', 'Roberto Bolaño', 'Anagrama', 'Novela', 15990, 2, false],
];

export async function ensureSeed(prisma: PrismaClient) {
  const users = await prisma.user.count();
  if (users > 0) return;

  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  mkdirSync(uploadDir, { recursive: true });
  const passwordHash = await hash('Admin123!', 10);

  await prisma.user.create({
    data: {
      email: 'admin@cmpc.cl',
      name: 'Administrador CMPC',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const authors = new Map<string, string>();
  const publishers = new Map<string, string>();
  const genres = new Map<string, string>();

  async function remember(map: Map<string, string>, name: string, create: () => Promise<{ id: string }>) {
    const known = map.get(name);
    if (known) return known;
    const created = await create();
    map.set(name, created.id);
    return created.id;
  }

  for (const [title, author, publisher, genre, price, stock, available] of BOOKS) {
    const filename = `${randomUUID()}.png`;
    writeFileSync(join(uploadDir, filename), PNG);
    await prisma.book.create({
      data: {
        title,
        price,
        stock,
        available,
        imagePath: `/uploads/${filename}`,
        authorId: await remember(authors, author, () => prisma.author.create({ data: { name: author } })),
        publisherId: await remember(publishers, publisher, () => prisma.publisher.create({ data: { name: publisher } })),
        genreId: await remember(genres, genre, () => prisma.genre.create({ data: { name: genre } })),
      },
    });
  }
}
