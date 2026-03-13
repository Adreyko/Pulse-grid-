import { TenantEntity } from './entities/tenant.entity';
import { TenantRepository } from './tenant.repository';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let tenantService: TenantService;
  let tenantRepository: jest.Mocked<TenantRepository>;

  beforeEach(() => {
    tenantRepository = {
      create: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<TenantRepository>;
    tenantService = new TenantService(tenantRepository);
  });

  it('normalizes a tenant slug', () => {
    expect(tenantService.normalizeSlug(' Studio Seven !! ')).toBe('studio-seven');
  });

  it('rejects duplicate slugs', async () => {
    tenantRepository.findBySlug.mockResolvedValue({
      id: 'tenant_northstar_studio',
      name: 'Northstar Studio',
      slug: 'northstar-studio',
      timezone: 'Europe/Kiev',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TenantEntity);

    await expect(
      tenantService.createTenant({
        name: 'Northstar Studio',
        slug: 'northstar-studio',
        timezone: 'Europe/Kiev',
      }),
    ).rejects.toThrow('Tenant slug "northstar-studio" already exists');
  });
});
