import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class ListPulsesQueryDto {
  @IsOptional()
  @IsString()
  @Length(10, 10)
  date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['me', 'tenant'])
  scope?: 'me' | 'tenant';
}
