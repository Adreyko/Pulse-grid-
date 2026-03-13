import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { TenantEntity } from './entities/tenant.entity';
import { TenantRepository } from './tenant.repository';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  const storageDir = join(tmpdir(), `pulsegrid-tenant-${Date.now()}`);
  const storageFile = join(storageDir, 'tenants.json');

  let tenantService: TenantService;

  beforeAll(async () => {
    await mkdir(storageDir, { recursive: true });
    const timestamp = new Date().toISOString();
    const store = new JsonFileStore<TenantEntity[]>(storageFile, () => [
      {
        id: 'tenant_northstar_studio',
        name: 'Northstar Studio',
        slug: 'northstar-studio',
        timezone: 'Europe/Kiev',
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);

    tenantService = new TenantService(new TenantRepository(store));
  });

  afterAll(async () => {
    await rm(storageDir, { recursive: true, force: true });
  });

  it('normalizes a tenant slug', () => {
    expect(tenantService.normalizeSlug(' Studio Seven !! ')).toBe('studio-seven');
  });

  it('rejects duplicate slugs', async () => {
    await expect(
      tenantService.createTenant({
        name: 'Northstar Studio',
        slug: 'northstar-studio',
        timezone: 'Europe/Kiev',
      }),
    ).rejects.toThrow('Tenant slug "northstar-studio" already exists');
  });
});
