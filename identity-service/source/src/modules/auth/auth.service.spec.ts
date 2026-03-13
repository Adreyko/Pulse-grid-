import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../../shared/security/password.service';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { TenantClientService } from '../../shared/tenants/tenant-client.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

describe('AuthService', () => {
  const storageDir = join(tmpdir(), `pulsegrid-auth-${Date.now()}`);
  const storageFile = join(storageDir, 'users.json');
  const passwordService = new PasswordService();
  const seedPassword = passwordService.createHash('ChangeMe!123');

  let authService: AuthService;

  beforeAll(async () => {
    await mkdir(storageDir, { recursive: true });
    const timestamp = new Date().toISOString();
    const store = new JsonFileStore<UserEntity[]>(storageFile, () => [
      {
        id: 'user_northstar_owner',
        tenantId: 'tenant_northstar_studio',
        name: 'Northstar Owner',
        email: 'owner@northstar.local',
        role: 'admin',
        passwordSalt: seedPassword.salt,
        passwordHash: seedPassword.hash,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);

    authService = new AuthService(
      new AuthRepository(store),
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

  afterAll(async () => {
    await rm(storageDir, { recursive: true, force: true });
  });

  it('creates a member user for a tenant', async () => {
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
    const session = await authService.login({
      tenantSlug: 'northstar-studio',
      email: 'owner@northstar.local',
      password: 'ChangeMe!123',
    });

    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.user.email).toBe('owner@northstar.local');
  });
});
