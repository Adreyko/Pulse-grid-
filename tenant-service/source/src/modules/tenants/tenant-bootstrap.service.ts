import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantRepository } from './tenant.repository';

@Injectable()
export class TenantBootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const defaultSlug = this.configService.get<string>('DEFAULT_TENANT_SLUG') ?? 'northstar-studio';
    const existingTenant = await this.tenantRepository.findBySlug(defaultSlug);

    if (existingTenant) {
      return;
    }

    await this.tenantRepository.create({
      name: this.configService.get<string>('DEFAULT_TENANT_NAME') ?? 'Northstar Studio',
      slug: defaultSlug,
      timezone: this.configService.get<string>('DEFAULT_TENANT_TIMEZONE') ?? 'Europe/Kiev',
    });
  }
}
