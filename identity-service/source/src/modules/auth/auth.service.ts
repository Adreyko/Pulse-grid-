import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { UserEntity } from './entities/user.entity';
import { AuthRepository } from './auth.repository';
import { PasswordService } from '../../shared/security/password.service';
import { TenantClientService } from '../../shared/tenants/tenant-client.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly tenantClientService: TenantClientService,
  ) {}

  async registerAdmin(dto: RegisterAdminDto) {
    this.assertPassword(dto.password);

    const tenant = await this.tenantClientService.resolveBySlug(dto.tenantSlug);
    const email = this.authRepository.normalizeEmail(dto.email);
    const existingUser = await this.authRepository.findByTenantAndEmail(tenant.id, email);

    if (existingUser) {
      throw new ConflictException(`User "${email}" already exists in this tenant`);
    }

    const password = this.passwordService.createHash(dto.password);

    const user = await this.authRepository.create({
      tenantId: tenant.id,
      name: dto.name.trim(),
      email,
      role: 'admin',
      passwordSalt: password.salt,
      passwordHash: password.hash,
    });

    return this.createAuthResponse(user, tenant.slug);
  }

  async login(dto: LoginDto) {
    const tenant = await this.tenantClientService.resolveBySlug(dto.tenantSlug);
    const email = this.authRepository.normalizeEmail(dto.email);
    const user = await this.authRepository.findByTenantAndEmail(tenant.id, email);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = this.passwordService.verify(
      dto.password,
      user.passwordSalt,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user, tenant.slug);
  }

  async getCurrentUser(headers: Record<string, string | string[] | undefined>) {
    const userId = this.readHeader(headers, 'x-user-id');
    const tenantId = this.readHeader(headers, 'x-tenant-id');

    if (!userId || !tenantId) {
      throw new UnauthorizedException('Trusted gateway headers are required');
    }

    const user = await this.authRepository.findById(userId);
    if (!user || user.tenantId !== tenantId || user.status !== 'active') {
      throw new NotFoundException('User was not found');
    }

    return this.sanitizeUser(user);
  }

  async createUser(dto: CreateUserDto, headers: Record<string, string | string[] | undefined>) {
    const actorRole = this.readHeader(headers, 'x-user-role');
    const tenantId = this.readHeader(headers, 'x-tenant-id');

    if (actorRole !== 'admin') {
      throw new ForbiddenException('Only admins can create users');
    }

    if (!tenantId) {
      throw new UnauthorizedException('Trusted tenant context is required');
    }

    this.assertPassword(dto.password);

    const email = this.authRepository.normalizeEmail(dto.email);
    const existingUser = await this.authRepository.findByTenantAndEmail(tenantId, email);
    if (existingUser) {
      throw new ConflictException(`User "${email}" already exists in this tenant`);
    }

    const password = this.passwordService.createHash(dto.password);
    const user = await this.authRepository.create({
      tenantId,
      name: dto.name.trim(),
      email,
      role: dto.role,
      passwordSalt: password.salt,
      passwordHash: password.hash,
    });

    return this.sanitizeUser(user);
  }

  sanitizeUser(user: UserEntity) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private createAuthResponse(user: UserEntity, tenantSlug: string) {
    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        tenantId: user.tenantId,
        tenantSlug,
        role: user.role,
        email: user.email,
        name: user.name,
      }),
      user: this.sanitizeUser(user),
    };
  }

  private assertPassword(value: string): void {
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
      throw new BadRequestException(
        'Password must include upper-case, lower-case, and numeric characters',
      );
    }
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string,
  ): string | null {
    const value = headers[key];

    if (Array.isArray(value)) {
      return value[0] ?? null;
    }

    return value ?? null;
  }
}
