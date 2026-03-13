export type TenantStatus = 'active' | 'suspended';

export interface TenantEntity {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}
