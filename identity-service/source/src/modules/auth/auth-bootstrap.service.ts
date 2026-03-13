import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from '../../shared/security/password.service';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthBootstrapService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const tenantId = this.configService.get<string>('DEFAULT_TENANT_ID') ?? 'tenant_northstar_studio';
    const email = this.configService.get<string>('DEFAULT_ADMIN_EMAIL') ?? 'owner@northstar.local';
    const existingUser = await this.authRepository.findByTenantAndEmail(tenantId, email);

    if (existingUser) {
      return;
    }

    const password = this.passwordService.createHash(
      this.configService.get<string>('DEFAULT_ADMIN_PASSWORD') ?? 'ChangeMe!123',
    );

    await this.authRepository.create({
      tenantId,
      name: this.configService.get<string>('DEFAULT_ADMIN_NAME') ?? 'Northstar Owner',
      email,
      role: 'admin',
      passwordSalt: password.salt,
      passwordHash: password.hash,
    });
  }
}
