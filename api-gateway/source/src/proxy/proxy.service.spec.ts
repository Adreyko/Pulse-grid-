import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { isPublicRoute, resolveServiceKey } from './proxy.routes';

describe('ProxyService', () => {
  it('maps service prefixes correctly', () => {
    expect(resolveServiceKey('/api/v1/pulses/digest')).toBe('pulses');
    expect(resolveServiceKey('/api/v1/auth/login')).toBe('auth');
    expect(resolveServiceKey('/api/v1/unknown')).toBeNull();
  });

  it('marks public onboarding routes', () => {
    expect(isPublicRoute('POST', '/api/v1/tenants')).toBe(true);
    expect(isPublicRoute('POST', '/api/v1/auth/login')).toBe(true);
    expect(isPublicRoute('GET', '/api/v1/pulses')).toBe(false);
  });

  it('injects trusted tenant and actor headers for downstream services', () => {
    const proxyService = new ProxyService(
      new ConfigService({
        TENANT_SERVICE_URL: 'http://tenant-service',
        IDENTITY_SERVICE_URL: 'http://identity-service',
        PULSE_SERVICE_URL: 'http://pulse-service',
      }),
    );

    const headers = proxyService.createForwardHeaders({
      headers: {
        authorization: 'Bearer token',
        'content-type': 'application/json',
      },
      tenant: {
        id: 'tenant_northstar_studio',
        slug: 'northstar-studio',
        timezone: 'Europe/Kiev',
      },
      actor: {
        sub: 'user_1',
        tenantId: 'tenant_northstar_studio',
        tenantSlug: 'northstar-studio',
        role: 'admin',
        email: 'owner@northstar.local',
        name: 'Alex Rowan',
      },
    } as any);

    expect(headers.get('x-tenant-id')).toBe('tenant_northstar_studio');
    expect(headers.get('x-user-id')).toBe('user_1');
    expect(headers.get('x-user-role')).toBe('admin');
  });
});
