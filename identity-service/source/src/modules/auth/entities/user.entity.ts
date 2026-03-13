export type UserRole = 'admin' | 'member';

export interface UserEntity {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  passwordSalt: string;
  passwordHash: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}
