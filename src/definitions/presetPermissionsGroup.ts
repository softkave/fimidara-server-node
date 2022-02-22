import {IAgent} from './system';

export interface IPresetPermissionsGroup {
  resourceId: string;
  organizationId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedAt?: Date | string;
  lastUpdatedBy?: IAgent;
  name: string;
  description?: string;
  presets: IAssignedPresetPermissionsGroup[];
}

export interface IAssignedPresetPermissionsGroup {
  presetId: string;
  assignedAt: Date | string;
  assignedBy: IAgent;
  order: number;
}
