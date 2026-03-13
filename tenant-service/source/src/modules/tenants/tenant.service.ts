import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantEntity } from './entities/tenant.entity';
import { TenantRepository } from './tenant.repository';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async createTenant(dto: CreateTenantDto): Promise<TenantEntity> {
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug ?? dto.name);
    const timezone = dto.timezone.trim();

    this.assertTimezone(timezone);

    const existingTenant = await this.tenantRepository.findBySlug(slug);
    if (existingTenant) {
      throw new ConflictException(`Tenant slug "${slug}" already exists`);
    }

    return this.tenantRepository.create({
      name,
      slug,
      timezone,
    });
  }

  async resolveTenant(slug: string): Promise<TenantEntity> {
    const normalizedSlug = this.normalizeSlug(slug);
    const tenant = await this.tenantRepository.findBySlug(normalizedSlug);

    if (!tenant || tenant.status !== 'active') {
      throw new NotFoundException(`Tenant "${normalizedSlug}" was not found`);
    }

    return tenant;
  }

  async getCurrentTenant(tenantId: string): Promise<TenantEntity> {
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant || tenant.status !== 'active') {
      throw new NotFoundException('Tenant was not found');
    }

    return tenant;
  }

  normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  private assertTimezone(value: string): void {
    try {
      Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    } catch {
      throw new BadRequestException('Timezone must be a valid IANA timezone');
    }
  }
}
