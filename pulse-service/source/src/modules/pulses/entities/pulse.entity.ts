export type PulseMood = 'focused' | 'steady' | 'stretched' | 'blocked';

export interface PulseEntity {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  date: string;
  mood: PulseMood;
  energy: number;
  wins: string[];
  blockers: string[];
  focus: string;
  createdAt: string;
  updatedAt: string;
}
