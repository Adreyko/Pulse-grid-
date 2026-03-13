import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantService } from './tenant.service';

@Controller()
export class TenantController {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('api/v1/tenants')
  async createTenant(@Body() dto: CreateTenantDto) {
    return {
      data: await this.tenantService.createTenant(dto),
    };
  }

  @Get('api/v1/tenants/current')
  async getCurrentTenant(@Headers('x-tenant-id') tenantId?: string) {
    return {
      data: await this.tenantService.getCurrentTenant(tenantId ?? ''),
    };
  }

  @Get('internal/tenants/resolve')
  async resolveTenant(
    @Headers('x-internal-token') internalToken?: string,
    @Query('slug') slug?: string,
  ) {
    const expectedToken =
      this.configService.get<string>('INTERNAL_TOKEN') ?? 'pulsegrid-internal-token';

    if (internalToken !== expectedToken) {
      throw new UnauthorizedException('Internal token is invalid');
    }

    if (!slug) {
      throw new BadRequestException('slug query parameter is required');
    }

    return {
      data: await this.tenantService.resolveTenant(slug),
    };
  }
}
