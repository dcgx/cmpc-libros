import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres').max(200),
  authorName: z.string().trim().min(2, 'Indica el autor').max(120),
  publisherName: z.string().trim().min(2, 'Indica la editorial').max(120),
  genreName: z.string().trim().min(2, 'Indica el género').max(80),
  price: z.coerce.number({ invalid_type_error: 'El precio es obligatorio' }).min(0, 'El precio no puede ser negativo'),
  stock: z.coerce.number({ invalid_type_error: 'El stock es obligatorio' }).int('El stock debe ser entero').min(0),
  available: z.enum(['true', 'false']),
});

export type BookFormValues = z.infer<typeof bookSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Ingresa un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
