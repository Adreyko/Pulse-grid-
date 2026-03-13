import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { HealthController } from './health.controller';
import { ProxyModule } from './proxy/proxy.module';
import { AuthContextMiddleware } from './shared/middleware/auth-context.middleware';
import { TenantContextMiddleware } from './shared/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.register({}),
    ProxyModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware, AuthContextMiddleware).forRoutes('*');
  }
}
