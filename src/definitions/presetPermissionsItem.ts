export interface IPresetPermissionsItem {
  presetId: string;
  organizationId: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  name: string;
  description?: string;
  // TODO: presets should contain other presets
}

export interface IAssignedPresetPermissionsGroup {
  presetId: string;
  assignedAt: string;
  assignedBy: string;
  order: number;
}
