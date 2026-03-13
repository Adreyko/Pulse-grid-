import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { PulseEntity } from './entities/pulse.entity';

@Injectable()
export class PulseRepository {
  constructor(
    @InjectRepository(PulseEntity)
    private readonly repository: Repository<PulseEntity>,
  ) {}

  async upsert(
    input: Omit<PulseEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PulseEntity> {
    const existingPulse = await this.repository.findOne({
      where: {
        tenantId: input.tenantId,
        memberId: input.memberId,
        date: input.date,
      },
    });

    if (existingPulse) {
      existingPulse.memberName = input.memberName;
      existingPulse.mood = input.mood;
      existingPulse.energy = input.energy;
      existingPulse.wins = [...input.wins];
      existingPulse.blockers = [...input.blockers];
      existingPulse.focus = input.focus;
      return this.repository.save(existingPulse);
    }

    return this.repository.save(
      this.repository.create({
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
      }),
    );
  }

  async findByTenant(tenantId: string): Promise<PulseEntity[]> {
    return this.repository.find({
      where: { tenantId },
      order: { date: 'DESC', updatedAt: 'DESC' },
    });
  }

  async findByTenantAndMember(tenantId: string, memberId: string): Promise<PulseEntity[]> {
    return this.repository.find({
      where: { tenantId, memberId },
      order: { date: 'DESC', updatedAt: 'DESC' },
    });
  }
}
