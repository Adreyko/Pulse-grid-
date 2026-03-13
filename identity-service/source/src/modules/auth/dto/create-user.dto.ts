import { IsEmail, IsIn, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(10, 120)
  password!: string;

  @IsString()
  @IsIn(['admin', 'member'])
  role!: 'admin' | 'member';
}
