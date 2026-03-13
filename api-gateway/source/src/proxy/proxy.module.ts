import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import { TenantContextMiddleware } from '../shared/middleware/tenant-context.middleware';
import { AuthContextMiddleware } from '../shared/middleware/auth-context.middleware';

@Module({
  controllers: [ProxyController],
  providers: [
    ProxyService,
    TenantResolverService,
    TenantContextMiddleware,
    AuthContextMiddleware,
  ],
})
export class ProxyModule {}
