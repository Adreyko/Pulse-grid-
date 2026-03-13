import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { TenantEntity } from './entities/tenant.entity';
import { TenantController } from './tenant.controller';
import { TenantRepository, TENANT_STORE } from './tenant.repository';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController],
  providers: [
    {
      provide: TENANT_STORE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storageDir =
          configService.get<string>('STORAGE_DIR') ?? resolve(process.cwd(), 'storage');
        const defaultTenantSlug =
          configService.get<string>('DEFAULT_TENANT_SLUG') ?? 'northstar-studio';
        const timestamp = new Date().toISOString();
        const seedTenant: TenantEntity = {
          id: `tenant_${defaultTenantSlug.replace(/-/g, '_')}`,
          name: configService.get<string>('DEFAULT_TENANT_NAME') ?? 'Northstar Studio',
          slug: defaultTenantSlug,
          timezone: configService.get<string>('DEFAULT_TENANT_TIMEZONE') ?? 'Europe/Kiev',
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        return new JsonFileStore<TenantEntity[]>(
          resolve(storageDir, 'tenants.json'),
          () => [seedTenant],
        );
      },
    },
    TenantRepository,
    TenantService,
  ],
  exports: [TenantService],
})
export class TenantModule {}
