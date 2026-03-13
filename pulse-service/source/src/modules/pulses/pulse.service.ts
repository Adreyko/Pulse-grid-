import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DigestQueryDto } from './dto/digest.query.dto';
import { ListPulsesQueryDto } from './dto/list-pulses.query.dto';
import { UpsertPulseDto } from './dto/upsert-pulse.dto';
import { PulseMood } from './entities/pulse.entity';
import { PulseRepository } from './pulse.repository';

interface ActorContext {
  tenantId: string;
  userId: string;
  userRole: string;
  userName: string;
  tenantTimezone: string;
}

@Injectable()
export class PulseService {
  constructor(private readonly pulseRepository: PulseRepository) {}

  async upsertPulse(
    dto: UpsertPulseDto,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const actor = this.readActor(headers);
    const date = this.normalizeDate(dto.date, actor.tenantTimezone);
    const mood = dto.mood.trim().toLowerCase() as PulseMood;

    if (!['focused', 'steady', 'stretched', 'blocked'].includes(mood)) {
      throw new BadRequestException(
        'Mood must be one of focused, steady, stretched, or blocked',
      );
    }

    return this.pulseRepository.upsert({
      tenantId: actor.tenantId,
      memberId: actor.userId,
      memberName: actor.userName,
      date,
      mood,
      energy: dto.energy,
      wins: dto.wins.map(item => item.trim()).filter(Boolean),
      blockers: dto.blockers.map(item => item.trim()).filter(Boolean),
      focus: dto.focus.trim(),
    });
  }

  async listPulses(
    query: ListPulsesQueryDto,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const actor = this.readActor(headers);
    const scope = query.scope ?? 'me';
    const date = query.date ? this.normalizeDate(query.date, actor.tenantTimezone) : null;

    let pulses =
      scope === 'tenant'
        ? await this.pulseRepository.findByTenant(actor.tenantId)
        : await this.pulseRepository.findByTenantAndMember(actor.tenantId, actor.userId);

    if (scope === 'tenant' && actor.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can view tenant-wide pulse history');
    }

    if (date) {
      pulses = pulses.filter(pulse => pulse.date === date);
    }

    return pulses.sort((left, right) =>
      `${right.date}${right.updatedAt}`.localeCompare(`${left.date}${left.updatedAt}`),
    );
  }

  async getDigest(
    query: DigestQueryDto,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const actor = this.readActor(headers);

    if (actor.userRole !== 'admin') {
      throw new ForbiddenException('Only admins can read pulse digests');
    }

    const date = this.normalizeDate(query.date, actor.tenantTimezone);
    const pulses = (await this.pulseRepository.findByTenant(actor.tenantId)).filter(
      pulse => pulse.date === date,
    );

    const moods: Record<PulseMood, number> = {
      focused: 0,
      steady: 0,
      stretched: 0,
      blocked: 0,
    };

    for (const pulse of pulses) {
      moods[pulse.mood] += 1;
    }

    return {
      date,
      totalEntries: pulses.length,
      averageEnergy: this.average(pulses.map(pulse => pulse.energy)),
      moods,
      wins: pulses.flatMap(pulse =>
        pulse.wins.map(value => ({ memberName: pulse.memberName, value })),
      ),
      blockers: pulses.flatMap(pulse =>
        pulse.blockers.map(value => ({ memberName: pulse.memberName, value })),
      ),
    };
  }

  async getStreak(headers: Record<string, string | string[] | undefined>) {
    const actor = this.readActor(headers);
    const pulses = await this.pulseRepository.findByTenantAndMember(actor.tenantId, actor.userId);
    const dates = [...new Set(pulses.map(pulse => pulse.date))].sort((left, right) =>
      right.localeCompare(left),
    );
    const today = this.currentDate(actor.tenantTimezone);
    let cursor = today;
    let currentStreak = 0;

    while (dates.includes(cursor)) {
      currentStreak += 1;
      cursor = this.previousDate(cursor);
    }

    return {
      currentStreak,
      lastEntryDate: dates[0] ?? null,
    };
  }

  private readActor(headers: Record<string, string | string[] | undefined>): ActorContext {
    const tenantId = this.readHeader(headers, 'x-tenant-id');
    const userId = this.readHeader(headers, 'x-user-id');
    const userRole = this.readHeader(headers, 'x-user-role');
    const userName = this.readHeader(headers, 'x-user-name');
    const tenantTimezone = this.readHeader(headers, 'x-tenant-timezone') ?? 'UTC';

    if (!tenantId || !userId || !userRole || !userName) {
      throw new UnauthorizedException('Trusted gateway headers are required');
    }

    return {
      tenantId,
      userId,
      userRole,
      userName,
      tenantTimezone,
    };
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined>,
    key: string,
  ): string | null {
    const value = headers[key];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return value ?? null;
  }

  private normalizeDate(value: string | undefined, timezone: string): string {
    if (!value) {
      return this.currentDate(timezone);
    }

    const normalized = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      throw new BadRequestException('Date must be in YYYY-MM-DD format');
    }

    return normalized;
  }

  private currentDate(timezone: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private previousDate(date: string): string {
    const cursor = new Date(`${date}T00:00:00.000Z`);
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    return cursor.toISOString().slice(0, 10);
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  }
}
