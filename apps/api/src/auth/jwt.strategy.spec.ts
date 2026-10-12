import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { getOrThrow: () => 'secret' } as unknown as ConfigService;

  it('rechaza un token cuyo usuario ya no existe', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } } as unknown as PrismaService;
    const strategy = new JwtStrategy(config, prisma);
    await expect(strategy.validate({ sub: 'ausente', email: 'admin@cmpc.cl', role: 'ADMIN' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('acepta un usuario vigente', async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', email: 'admin@cmpc.cl', role: 'ADMIN' }) },
    } as unknown as PrismaService;
    const strategy = new JwtStrategy(config, prisma);
    await expect(strategy.validate({ sub: 'user-1', email: 'viejo@cmpc.cl', role: 'STAFF' })).resolves.toEqual({
      id: 'user-1',
      email: 'admin@cmpc.cl',
      role: 'ADMIN',
    });
  });
});