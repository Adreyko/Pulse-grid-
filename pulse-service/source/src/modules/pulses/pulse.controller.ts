import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { DigestQueryDto } from './dto/digest.query.dto';
import { ListPulsesQueryDto } from './dto/list-pulses.query.dto';
import { UpsertPulseDto } from './dto/upsert-pulse.dto';
import { PulseService } from './pulse.service';

@Controller('api/v1/pulses')
export class PulseController {
  constructor(private readonly pulseService: PulseService) {}

  @Post()
  async upsertPulse(
    @Body() dto: UpsertPulseDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return {
      data: await this.pulseService.upsertPulse(dto, headers),
    };
  }

  @Get()
  async listPulses(
    @Query() query: ListPulsesQueryDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return {
      data: await this.pulseService.listPulses(query, headers),
    };
  }

  @Get('digest')
  async getDigest(
    @Query() query: DigestQueryDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    return {
      data: await this.pulseService.getDigest(query, headers),
    };
  }

  @Get('streak')
  async getStreak(@Headers() headers: Record<string, string | string[] | undefined>) {
    return {
      data: await this.pulseService.getStreak(headers),
    };
  }
}
