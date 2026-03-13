import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { PulseEntity } from './entities/pulse.entity';

export const PULSE_STORE = Symbol('PULSE_STORE');

@Injectable()
export class PulseRepository {
  constructor(
    @Inject(PULSE_STORE)
    private readonly store: JsonFileStore<PulseEntity[]>,
  ) {}

  async upsert(
    input: Omit<PulseEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PulseEntity> {
    let savedPulse: PulseEntity | null = null;

    await this.store.update(current => {
      const existingPulse = current.find(
        pulse =>
          pulse.tenantId === input.tenantId &&
          pulse.memberId === input.memberId &&
          pulse.date === input.date,
      );

      if (existingPulse) {
        existingPulse.memberName = input.memberName;
        existingPulse.mood = input.mood;
        existingPulse.energy = input.energy;
        existingPulse.wins = [...input.wins];
        existingPulse.blockers = [...input.blockers];
        existingPulse.focus = input.focus;
        existingPulse.updatedAt = new Date().toISOString();
        savedPulse = structuredClone(existingPulse);
        return current;
      }

      const timestamp = new Date().toISOString();
      const createdPulse: PulseEntity = {
        id: `pulse_${randomUUID().replace(/-/g, '')}`,
        tenantId: input.tenantId,
        memberId: input.memberId,
        memberName: input.memberName,
        date: input.date,
        mood: input.mood,
        energy: input.energy,
        wins: [...input.wins],
        blockers: [...input.blockers],
        focus: input.focus,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      savedPulse = createdPulse;
      return [...current, createdPulse];
    });

    if (!savedPulse) {
      throw new Error('Pulse upsert failed');
    }

    return savedPulse;
  }

  async findByTenant(tenantId: string): Promise<PulseEntity[]> {
    const pulses = await this.store.read();
    return pulses.filter(pulse => pulse.tenantId === tenantId);
  }

  async findByTenantAndMember(tenantId: string, memberId: string): Promise<PulseEntity[]> {
    const pulses = await this.store.read();
    return pulses.filter(pulse => pulse.tenantId === tenantId && pulse.memberId === memberId);
  }
}
