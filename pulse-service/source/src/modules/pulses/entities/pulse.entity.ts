import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type PulseMood = 'focused' | 'steady' | 'stretched' | 'blocked';

@Entity({ name: 'pulses' })
@Unique('pulses_tenant_member_date_unique', ['tenantId', 'memberId', 'date'])
export class PulseEntity {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  tenantId!: string;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  memberId!: string;

  @Column({ type: 'varchar', length: 120 })
  memberName!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 24 })
  mood!: PulseMood;

  @Column({ type: 'int' })
  energy!: number;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  wins!: string[];

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  blockers!: string[];

  @Column({ type: 'varchar', length: 180 })
  focus!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
