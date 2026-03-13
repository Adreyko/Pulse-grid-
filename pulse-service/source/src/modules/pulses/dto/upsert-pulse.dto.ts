import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { PulseMood } from '../entities/pulse.entity';

export class UpsertPulseDto {
  @IsOptional()
  @IsString()
  @Length(10, 10)
  date?: string;

  @IsString()
  mood!: PulseMood;

  @IsInt()
  @Min(1)
  @Max(5)
  energy!: number;

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  wins!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  blockers!: string[];

  @IsString()
  @Length(5, 180)
  focus!: string;
}
