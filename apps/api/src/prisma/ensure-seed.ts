import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export async function ensureSeed(prisma: PrismaClient) {
  const users = await prisma.user.count();
  if (users > 0) return;

  const passwordHash = await hash('Admin123!', 10);
  await prisma.user.create({
    data: {
      email: 'admin@cmpc.cl',
      name: 'Administrador CMPC',
      passwordHash,
      role: 'ADMIN',
    },
  });
}
