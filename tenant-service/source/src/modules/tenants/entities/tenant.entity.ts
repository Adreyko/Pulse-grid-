import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TenantStatus = 'active' | 'suspended';

@Entity({ name: 'tenants' })
export class TenantEntity {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 120 })
  timezone!: string;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status!: TenantStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
