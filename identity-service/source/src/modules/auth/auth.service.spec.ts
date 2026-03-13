import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../../shared/security/password.service';
import { TenantClientService } from '../../shared/tenants/tenant-client.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

describe('AuthService', () => {
  const passwordService = new PasswordService();
  const seedPassword = passwordService.createHash('ChangeMe!123');

  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepository = {
      normalizeEmail: jest.fn((email: string) => email.trim().toLowerCase()),
      create: jest.fn(),
      findByTenantAndEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    authService = new AuthService(
      authRepository,
      new JwtService({ secret: 'secret' }),
      passwordService,
      {
        resolveBySlug: jest.fn().mockResolvedValue({
          id: 'tenant_northstar_studio',
          slug: 'northstar-studio',
          timezone: 'Europe/Kiev',
        }),
      } as unknown as TenantClientService,
    );
  });

  it('creates a member user for a tenant', async () => {
    authRepository.findByTenantAndEmail.mockResolvedValue(null);
    authRepository.create.mockImplementation(async input => ({
      id: 'user_1',
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordSalt: input.passwordSalt,
      passwordHash: input.passwordHash,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as UserEntity);

    const user = await authService.createUser(
      {
        name: 'Nina Hart',
        email: 'nina@northstar.local',
        password: 'MemberPass123',
        role: 'member',
      },
      {
        'x-user-role': 'admin',
        'x-tenant-id': 'tenant_northstar_studio',
      },
    );

    expect(user.email).toBe('nina@northstar.local');
    expect(user.role).toBe('member');
  });

  it('returns a signed access token on login', async () => {
    authRepository.findByTenantAndEmail.mockResolvedValue({
      id: 'user_northstar_owner',
      tenantId: 'tenant_northstar_studio',
      name: 'Northstar Owner',
      email: 'owner@northstar.local',
      role: 'admin',
      passwordSalt: seedPassword.salt,
      passwordHash: seedPassword.hash,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserEntity);

    const session = await authService.login({
      tenantSlug: 'northstar-studio',
      email: 'owner@northstar.local',
      password: 'ChangeMe!123',
    });

    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.user.email).toBe('owner@northstar.local');
  });
});
