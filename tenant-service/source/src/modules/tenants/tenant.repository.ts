import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from './entities/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  async create(input: Pick<TenantEntity, 'name' | 'slug' | 'timezone'>): Promise<TenantEntity> {
    const tenant = this.repository.create({
      id: this.createTenantId(input.slug),
      name: input.name,
      slug: input.slug,
      timezone: input.timezone,
      status: 'active',
    });

    return this.repository.save(tenant);
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    return this.repository.findOne({
      where: { slug },
    });
  }

  async findById(id: string): Promise<TenantEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  private createTenantId(slug: string): string {
    return `tenant_${slug.replace(/-/g, '_')}`;
  }
}
