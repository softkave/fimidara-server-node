export interface IPublicPresetPermissionsItem {
  itemId: string;
  organizationId: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

export interface IPresetInput {
  presetId: string;
  order: number;
}
