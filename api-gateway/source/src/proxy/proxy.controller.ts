import { All, Controller, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { GatewayRequest } from '../shared/interfaces/gateway-request.interface';
import { ProxyService } from './proxy.service';

@Controller('api')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*path')
  async proxyRequest(@Req() req: GatewayRequest, @Res() res: Response) {
    await this.proxyService.proxyRequest(req, res);
  }
}
