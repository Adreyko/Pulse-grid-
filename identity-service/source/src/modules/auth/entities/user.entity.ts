import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'member';

@Entity({ name: 'users' })
@Unique('users_tenant_email_unique', ['tenantId', 'email'])
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 160 })
  email!: string;

  @Column({ type: 'varchar', length: 24 })
  role!: UserRole;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordSalt!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 24, default: 'active' })
  status!: 'active' | 'disabled';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
