import {IAgent} from './system';
import {IAssignedTag} from './tag';

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
  tags: IAssignedTag[];
}

export interface IAssignedPresetPermissionsGroup {
  presetId: string;
  assignedAt: Date | string;
  assignedBy: IAgent;
  order: number;
}

export interface IPresetPermissionsGroupMatcher {
  presetId?: string;
  name?: string;
  organizationId?: string;
}

export interface IPublicPresetPermissionsGroup {
  resourceId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  name: string;
  description?: string;
  presets: IAssignedPresetPermissionsGroup[];
  tags: IAssignedTag[];
}

export interface IPresetInput {
  presetId: string;
  order: number;
}
