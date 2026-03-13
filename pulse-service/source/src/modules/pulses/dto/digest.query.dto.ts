import { IsString, Length } from 'class-validator';

export class DigestQueryDto {
  @IsString()
  @Length(10, 10)
  date!: string;
}
