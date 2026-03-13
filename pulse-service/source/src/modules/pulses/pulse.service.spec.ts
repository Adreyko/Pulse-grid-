import { PulseEntity } from './entities/pulse.entity';
import { PulseRepository } from './pulse.repository';
import { PulseService } from './pulse.service';

describe('PulseService', () => {
  let pulseService: PulseService;
  let pulseRepository: jest.Mocked<PulseRepository>;
  let inMemoryPulses: PulseEntity[];

  beforeEach(() => {
    inMemoryPulses = [];
    pulseRepository = {
      upsert: jest.fn(async input => {
        const existingPulse = inMemoryPulses.find(
          pulse =>
            pulse.tenantId === input.tenantId &&
            pulse.memberId === input.memberId &&
            pulse.date === input.date,
        );

        if (existingPulse) {
          existingPulse.memberName = input.memberName;
          existingPulse.mood = input.mood;
          existingPulse.energy = input.energy;
          existingPulse.wins = input.wins;
          existingPulse.blockers = input.blockers;
          existingPulse.focus = input.focus;
          existingPulse.updatedAt = new Date();
          return existingPulse;
        }

        const createdPulse = {
          id: `pulse_${inMemoryPulses.length + 1}`,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PulseEntity;
        inMemoryPulses.push(createdPulse);
        return createdPulse;
      }),
      findByTenant: jest.fn(async tenantId => inMemoryPulses.filter(pulse => pulse.tenantId === tenantId)),
      findByTenantAndMember: jest.fn(async (tenantId, memberId) =>
        inMemoryPulses.filter(
          pulse => pulse.tenantId === tenantId && pulse.memberId === memberId,
        ),
      ),
    } as unknown as jest.Mocked<PulseRepository>;
    pulseService = new PulseService(pulseRepository);
  });

  it('upserts the pulse for the same member and date', async () => {
    await pulseService.upsertPulse(
      {
        date: '2026-03-12',
        mood: 'focused',
        energy: 4,
        wins: ['Shipped dashboard'],
        blockers: [],
        focus: 'Prepare onboarding flow',
      },
      {
        'x-tenant-id': 'tenant_1',
        'x-user-id': 'user_1',
        'x-user-role': 'member',
        'x-user-name': 'Nina Hart',
        'x-tenant-timezone': 'UTC',
      },
    );

    const pulse = await pulseService.upsertPulse(
      {
        date: '2026-03-12',
        mood: 'steady',
        energy: 5,
        wins: ['Shipped dashboard'],
        blockers: ['Waiting on brand copy'],
        focus: 'Prepare onboarding flow',
      },
      {
        'x-tenant-id': 'tenant_1',
        'x-user-id': 'user_1',
        'x-user-role': 'member',
        'x-user-name': 'Nina Hart',
        'x-tenant-timezone': 'UTC',
      },
    );

    expect(pulse.mood).toBe('steady');

    const list = await pulseService.listPulses(
      { scope: 'me' },
      {
        'x-tenant-id': 'tenant_1',
        'x-user-id': 'user_1',
        'x-user-role': 'member',
        'x-user-name': 'Nina Hart',
        'x-tenant-timezone': 'UTC',
      },
    );

    expect(list).toHaveLength(1);
  });

  it('builds a tenant digest for admins', async () => {
    await pulseService.upsertPulse(
      {
        date: '2026-03-13',
        mood: 'focused',
        energy: 4,
        wins: ['Closed sprint scope'],
        blockers: [],
        focus: 'Run backlog refinement',
      },
      {
        'x-tenant-id': 'tenant_1',
        'x-user-id': 'user_admin',
        'x-user-role': 'admin',
        'x-user-name': 'Alex Rowan',
        'x-tenant-timezone': 'UTC',
      },
    );

    await pulseService.upsertPulse(
      {
        date: '2026-03-13',
        mood: 'blocked',
        energy: 2,
        wins: [],
        blockers: ['No QA data set'],
        focus: 'Fix import pipeline',
      },
      {
        'x-tenant-id': 'tenant_1',
        'x-user-id': 'user_member_2',
        'x-user-role': 'member',
        'x-user-name': 'Mika Vale',
        'x-tenant-timezone': 'UTC',
      },
    );

    const digest = await pulseService.getDigest(
      { date: '2026-03-13' },
      {
        'x-tenant-id': 'tenant_1',
        'x-user-id': 'user_admin',
        'x-user-role': 'admin',
        'x-user-name': 'Alex Rowan',
        'x-tenant-timezone': 'UTC',
      },
    );

    expect(digest.totalEntries).toBe(2);
    expect(digest.averageEnergy).toBe(3);
    expect(digest.moods.blocked).toBe(1);
  });
});
