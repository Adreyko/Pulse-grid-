import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { TenantEntity } from './entities/tenant.entity';

export const TENANT_STORE = Symbol('TENANT_STORE');

@Injectable()
export class TenantRepository {
  constructor(
    @Inject(TENANT_STORE)
    private readonly store: JsonFileStore<TenantEntity[]>,
  ) {}

  async create(input: Pick<TenantEntity, 'name' | 'slug' | 'timezone'>): Promise<TenantEntity> {
    const timestamp = new Date().toISOString();
    const tenant: TenantEntity = {
      id: this.createTenantId(input.slug),
      name: input.name,
      slug: input.slug,
      timezone: input.timezone,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.store.update(tenants => [...tenants, tenant]);
    return tenant;
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const tenants = await this.store.read();
    return tenants.find(tenant => tenant.slug === slug) ?? null;
  }

  async findById(id: string): Promise<TenantEntity | null> {
    const tenants = await this.store.read();
    return tenants.find(tenant => tenant.id === id) ?? null;
  }

  createSeedTenant(input: {
    slug: string;
    name: string;
    timezone: string;
  }): TenantEntity {
    const timestamp = new Date().toISOString();
    return {
      id: this.createTenantId(input.slug),
      name: input.name,
      slug: input.slug,
      timezone: input.timezone,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private createTenantId(slug: string): string {
    return `tenant_${slug.replace(/-/g, '_')}_${randomUUID().slice(0, 8)}`;
  }
}
