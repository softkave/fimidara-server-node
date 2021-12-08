import {IAgent} from './system';

export interface IPresetPermissionsGroup {
  presetId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  name: string;
  description?: string;
  presets: IAssignedPresetPermissionsGroup[];
}

export interface IAssignedPresetPermissionsGroup {
  presetId: string;
  assignedAt: string;
  assignedBy: IAgent;
  order: number;
}
