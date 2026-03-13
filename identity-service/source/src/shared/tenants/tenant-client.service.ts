import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantRecord } from './tenant-record.interface';

@Injectable()
export class TenantClientService {
  constructor(private readonly configService: ConfigService) {}

  async resolveBySlug(slug: string): Promise<TenantRecord> {
    const tenantServiceUrl =
      this.configService.get<string>('TENANT_SERVICE_URL') ?? 'http://localhost:4101';
    const internalToken =
      this.configService.get<string>('INTERNAL_TOKEN') ?? 'pulsegrid-internal-token';

    let response: Response;

    try {
      response = await fetch(
        `${tenantServiceUrl}/internal/tenants/resolve?slug=${encodeURIComponent(slug)}`,
        {
          headers: {
            'x-internal-token': internalToken,
          },
        },
      );
    } catch {
      throw new BadGatewayException('Tenant service is unavailable');
    }

    if (response.status === 404) {
      throw new NotFoundException(`Tenant "${slug}" was not found`);
    }

    if (!response.ok) {
      throw new BadGatewayException('Tenant service returned an unexpected response');
    }

    const payload = (await response.json()) as { data: TenantRecord };
    return payload.data;
  }
}
