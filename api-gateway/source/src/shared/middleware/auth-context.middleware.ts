import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';
import { isGatewayRoute, isPublicRoute } from '../../proxy/proxy.routes';
import { ActorContext, GatewayRequest } from '../interfaces/gateway-request.interface';

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: GatewayRequest, _res: Response, next: NextFunction) {
    const method = req.method.toUpperCase();
    const pathname = req.path;

    if (!isGatewayRoute(pathname) || pathname === '/health' || isPublicRoute(method, pathname)) {
      next();
      return;
    }

    const authorizationHeader = req.headers.authorization;
    const token = this.extractToken(authorizationHeader);

    const payload = await this.jwtService.verifyAsync<ActorContext>(token, {
      secret: process.env.JWT_SECRET ?? 'pulsegrid-jwt-secret',
    });

    if (!req.tenant) {
      throw new UnauthorizedException('Tenant context was not resolved');
    }

    if (payload.tenantId !== req.tenant.id || payload.tenantSlug !== req.tenant.slug) {
      throw new UnauthorizedException('Token tenant does not match selected tenant');
    }

    req.actor = payload;
    next();
  }

  private extractToken(value?: string): string {
    if (!value) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = value.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Authorization header must use Bearer token');
    }

    return token;
  }
}
