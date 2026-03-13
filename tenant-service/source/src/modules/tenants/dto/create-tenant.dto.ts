import { IsOptional, IsString, Length } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Length(3, 120)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(3, 120)
  slug?: string;

  @IsString()
  @Length(3, 120)
  timezone!: string;
}
