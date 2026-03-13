import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterAdminDto {
  @IsString()
  @Length(3, 120)
  tenantSlug!: string;

  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(10, 120)
  password!: string;
}
