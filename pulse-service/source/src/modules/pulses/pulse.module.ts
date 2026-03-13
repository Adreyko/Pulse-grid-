import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'node:path';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { PulseController } from './pulse.controller';
import { PulseEntity } from './entities/pulse.entity';
import { PulseRepository, PULSE_STORE } from './pulse.repository';
import { PulseService } from './pulse.service';

@Module({
  controllers: [PulseController],
  providers: [
    {
      provide: PULSE_STORE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storageDir =
          configService.get<string>('STORAGE_DIR') ?? resolve(process.cwd(), 'storage');
        return new JsonFileStore<PulseEntity[]>(resolve(storageDir, 'pulses.json'), () => []);
      },
    },
    PulseRepository,
    PulseService,
  ],
})
export class PulseModule {}
