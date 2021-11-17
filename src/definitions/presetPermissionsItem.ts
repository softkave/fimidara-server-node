export interface IPresetPermissionsItem {
  presetId: string;
  organizationId: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  name: string;
  description?: string;
}

export interface IAssignedPresetItem {
  presetId: string;
  assignedAt: string;
  assignedBy: string;
  order: number;
}
