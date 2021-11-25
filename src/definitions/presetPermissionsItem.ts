import {IAgent} from './system';

export interface IPresetPermissionsItem {
  presetId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  name: string;
  description?: string;
  // TODO: presets should contain other presets
}

export interface IAssignedPresetPermissionsGroup {
  presetId: string;
  assignedAt: string;
  assignedBy: IAgent;
  order: number;
}
