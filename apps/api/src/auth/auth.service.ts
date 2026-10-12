import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = user ? await compare(password, user.passwordHash) : false;

    if (!user || !valid) {
      await this.audit.record({
        action: 'LOGIN_FAILURE',
        entity: 'auth',
        metadata: { email },
        ip,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    await this.audit.record({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'auth',
      entityId: user.id,
      ip,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
