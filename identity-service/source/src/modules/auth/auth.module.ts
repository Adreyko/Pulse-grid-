import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { resolve } from 'node:path';
import { PasswordService } from '../../shared/security/password.service';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { TenantClientService } from '../../shared/tenants/tenant-client.service';
import { AuthController } from './auth.controller';
import { AuthRepository, USER_STORE } from './auth.repository';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'pulsegrid-jwt-secret',
        signOptions: {
          expiresIn: '12h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_STORE,
      inject: [ConfigService, PasswordService],
      useFactory: (configService: ConfigService, passwordService: PasswordService) => {
        const storageDir =
          configService.get<string>('STORAGE_DIR') ?? resolve(process.cwd(), 'storage');
        const password = passwordService.createHash(
          configService.get<string>('DEFAULT_ADMIN_PASSWORD') ?? 'ChangeMe!123',
        );
        const timestamp = new Date().toISOString();
        const seedUser: UserEntity = {
          id: 'user_northstar_owner',
          tenantId: configService.get<string>('DEFAULT_TENANT_ID') ?? 'tenant_northstar_studio',
          name: configService.get<string>('DEFAULT_ADMIN_NAME') ?? 'Northstar Owner',
          email:
            configService.get<string>('DEFAULT_ADMIN_EMAIL')?.trim().toLowerCase() ??
            'owner@northstar.local',
          role: 'admin',
          passwordSalt: password.salt,
          passwordHash: password.hash,
          status: 'active',
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        return new JsonFileStore<UserEntity[]>(resolve(storageDir, 'users.json'), () => [seedUser]);
      },
    },
    PasswordService,
    TenantClientService,
    AuthRepository,
    AuthService,
  ],
})
export class AuthModule {}
