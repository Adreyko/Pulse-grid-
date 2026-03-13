import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PulseController } from './pulse.controller';
import { PulseEntity } from './entities/pulse.entity';
import { PulseRepository } from './pulse.repository';
import { PulseService } from './pulse.service';

@Module({
  imports: [TypeOrmModule.forFeature([PulseEntity])],
  controllers: [PulseController],
  providers: [PulseRepository, PulseService],
})
export class PulseModule {}
