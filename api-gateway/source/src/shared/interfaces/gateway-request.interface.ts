import { Request } from 'express';

export interface TenantContext {
  id: string;
  slug: string;
  timezone: string;
}

export interface ActorContext {
  sub: string;
  tenantId: string;
  tenantSlug: string;
  role: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface GatewayRequest extends Request {
  tenant?: TenantContext;
  actor?: ActorContext;
}
