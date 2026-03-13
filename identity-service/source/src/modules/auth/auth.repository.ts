import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JsonFileStore } from '../../shared/storage/json-file.store';
import { UserEntity, UserRole } from './entities/user.entity';

export const USER_STORE = Symbol('USER_STORE');

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(USER_STORE)
    private readonly store: JsonFileStore<UserEntity[]>,
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
    const timestamp = new Date().toISOString();
    const user: UserEntity = {
      id: `user_${randomUUID().replace(/-/g, '')}`,
      tenantId: input.tenantId,
      name: input.name,
      email: this.normalizeEmail(input.email),
      role: input.role,
      passwordSalt: input.passwordSalt,
      passwordHash: input.passwordHash,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.store.update(users => [...users, user]);
    return user;
  }

  async findByTenantAndEmail(tenantId: string, email: string): Promise<UserEntity | null> {
    const users = await this.store.read();
    const normalizedEmail = this.normalizeEmail(email);
    return (
      users.find(user => user.tenantId === tenantId && user.email === normalizedEmail) ?? null
    );
  }

  async findById(id: string): Promise<UserEntity | null> {
    const users = await this.store.read();
    return users.find(user => user.id === id) ?? null;
  }
}
