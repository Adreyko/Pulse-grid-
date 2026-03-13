import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-admin')
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return {
      data: await this.authService.registerAdmin(dto),
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return {
      data: await this.authService.login(dto),
    };
  }

  @Get('me')
  async me(@Headers() headers: Record<string, string | string[] | undefined>) {
    return {
      data: await this.authService.getCurrentUser(headers),
    };
  }

  @Post('users')
  async createUser(
    @Body() dto: CreateUserDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return {
      data: await this.authService.createUser(dto, headers),
    };
  }
}
