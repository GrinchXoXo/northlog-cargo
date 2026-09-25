export interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  createdAt: string;
  memberCount: number;
}

export interface ProvisionedOrganization {
  id: string;
  name: string;
  slug: string;
}
