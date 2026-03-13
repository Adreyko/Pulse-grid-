import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 120)
  tenantSlug!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(10, 120)
  password!: string;
}
