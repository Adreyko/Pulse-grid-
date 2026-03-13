import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TenantEntity } from '../../modules/tenants/entities/tenant.entity';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'pulsegrid_tenants',
    entities: [TenantEntity],
    autoLoadEntities: true,
    synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
    migrationsRun: false,
    ssl: (process.env.DB_SSL ?? 'false') === 'true' ? { rejectUnauthorized: false } : false,
    logging: (process.env.DB_LOGGING ?? 'false') === 'true',
  };
}
