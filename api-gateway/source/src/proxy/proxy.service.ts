import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { GatewayRequest } from '../shared/interfaces/gateway-request.interface';
import { resolveServiceKey, ServiceKey } from './proxy.routes';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  constructor(private readonly configService: ConfigService) {}

  async proxyRequest(req: GatewayRequest, res: ExpressResponse): Promise<void> {
    const serviceKey = resolveServiceKey(req.path);

    if (!serviceKey) {
      throw new NotFoundException('No service is mapped to this route');
    }

    const targetBaseUrl = this.resolveTargetBaseUrl(serviceKey);
    const headers = this.createForwardHeaders(req);
    const body = this.createForwardBody(req);

    let upstreamResponse: globalThis.Response;

    try {
      upstreamResponse = await fetch(`${targetBaseUrl}${req.originalUrl}`, {
        method: req.method,
        headers,
        body,
      });
    } catch {
      throw new ServiceUnavailableException(`The ${serviceKey} service is unavailable`);
    }

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (!['content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const payload = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(payload);
  }

  resolveTargetBaseUrl(serviceKey: ServiceKey): string {
    const mapping: Record<ServiceKey, string> = {
      auth: this.configService.get<string>('IDENTITY_SERVICE_URL') ?? 'http://localhost:4102',
      tenants: this.configService.get<string>('TENANT_SERVICE_URL') ?? 'http://localhost:4101',
      pulses: this.configService.get<string>('PULSE_SERVICE_URL') ?? 'http://localhost:4103',
    };

    return mapping[serviceKey];
  }

  createForwardHeaders(req: GatewayRequest): Headers {
    const headers = new Headers();

    for (const [key, rawValue] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'host' || key.toLowerCase() === 'content-length') {
        continue;
      }

      if (Array.isArray(rawValue)) {
        headers.set(key, rawValue.join(','));
      } else if (typeof rawValue === 'string') {
        headers.set(key, rawValue);
      }
    }

    if (req.tenant) {
      headers.set('x-tenant-id', req.tenant.id);
      headers.set('x-tenant-slug', req.tenant.slug);
      headers.set('x-tenant-timezone', req.tenant.timezone);
    }

    if (req.actor) {
      headers.set('x-user-id', req.actor.sub);
      headers.set('x-user-role', req.actor.role);
      headers.set('x-user-name', req.actor.name);
    }

    return headers;
  }

  createForwardBody(req: GatewayRequest): BodyInit | undefined {
    if (['GET', 'HEAD'].includes(req.method.toUpperCase())) {
      return undefined;
    }

    if (!req.body || Object.keys(req.body as Record<string, unknown>).length === 0) {
      return undefined;
    }

    return JSON.stringify(req.body);
  }
}
