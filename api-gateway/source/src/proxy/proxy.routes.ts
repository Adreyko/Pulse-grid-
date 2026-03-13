export type ServiceKey = 'auth' | 'tenants' | 'pulses';

const routeEntries: Array<{ prefix: string; serviceKey: ServiceKey }> = [
  { prefix: '/api/v1/auth', serviceKey: 'auth' },
  { prefix: '/api/v1/tenants', serviceKey: 'tenants' },
  { prefix: '/api/v1/pulses', serviceKey: 'pulses' },
];

const publicRoutes = new Set([
  'POST /api/v1/tenants',
  'POST /api/v1/auth/register-admin',
  'POST /api/v1/auth/login',
]);

export function resolveServiceKey(pathname: string): ServiceKey | null {
  return routeEntries.find(entry => pathname.startsWith(entry.prefix))?.serviceKey ?? null;
}

export function isGatewayRoute(pathname: string): boolean {
  return pathname.startsWith('/api/v1/');
}

export function isPublicRoute(method: string, pathname: string): boolean {
  return publicRoutes.has(`${method.toUpperCase()} ${pathname}`);
}
