import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from '../../shared/security/password.service';
import { TenantClientService } from '../../shared/tenants/tenant-client.service';
import { AuthController } from './auth.controller';
import { AuthBootstrapService } from './auth-bootstrap.service';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
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
    PasswordService,
    TenantClientService,
    AuthRepository,
    AuthService,
    AuthBootstrapService,
  ],
})
export class AuthModule {}
