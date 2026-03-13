import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async create(input: {
    tenantId: string;
    name: string;
    email: string;
    role: UserRole;
    passwordSalt: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const user = this.repository.create({
      id: `user_${randomUUID().replace(/-/g, '')}`,
      tenantId: input.tenantId,
      name: input.name,
      email: this.normalizeEmail(input.email),
      role: input.role,
      passwordSalt: input.passwordSalt,
      passwordHash: input.passwordHash,
      status: 'active',
    });

    return this.repository.save(user);
  }

  async findByTenantAndEmail(tenantId: string, email: string): Promise<UserEntity | null> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.repository
      .createQueryBuilder('user')
      .addSelect(['user.passwordSalt', 'user.passwordHash'])
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.email = :email', { email: normalizedEmail })
      .getOne();
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }
}
