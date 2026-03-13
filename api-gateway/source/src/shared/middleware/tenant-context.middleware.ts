import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { resolveServiceKey, isGatewayRoute, isPublicRoute } from '../../proxy/proxy.routes';
import { GatewayRequest } from '../interfaces/gateway-request.interface';
import { TenantResolverService } from '../../tenant/tenant-resolver.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantResolverService: TenantResolverService) {}

  async use(req: GatewayRequest, _res: Response, next: NextFunction) {
    const method = req.method.toUpperCase();
    const pathname = req.path;

    if (!isGatewayRoute(pathname) || pathname === '/health') {
      next();
      return;
    }

    if (!resolveServiceKey(pathname)) {
      next();
      return;
    }

    if (isPublicRoute(method, pathname)) {
      next();
      return;
    }

    const tenantSlugHeader = req.headers['x-tenant-slug'];
    const tenantSlug = Array.isArray(tenantSlugHeader)
      ? tenantSlugHeader[0]
      : tenantSlugHeader;

    if (!tenantSlug) {
      throw new BadRequestException('x-tenant-slug header is required');
    }

    req.tenant = await this.tenantResolverService.resolveBySlug(tenantSlug);
    next();
  }
}
