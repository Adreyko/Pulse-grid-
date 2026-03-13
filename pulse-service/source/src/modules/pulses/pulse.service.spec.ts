import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { PulseEntity } from './entities/pulse.entity';
import { PulseRepository } from './pulse.repository';
import { PulseService } from './pulse.service';

describe('PulseService', () => {
  const storageDir = join(tmpdir(), `pulsegrid-pulses-${Date.now()}`);
  const storageFile = join(storageDir, 'pulses.json');

  let pulseService: PulseService;

  beforeAll(async () => {
    await mkdir(storageDir, { recursive: true });
    const store = new JsonFileStore<PulseEntity[]>(storageFile, () => []);
    pulseService = new PulseService(new PulseRepository(store));
  });

  afterAll(async () => {
    await rm(storageDir, { recursive: true, force: true });
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
