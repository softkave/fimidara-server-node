import {IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IPresetPermissionsGroup {
  resourceId: string;
  workspaceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  name: string;
  description?: string;

  // presets: IAssignedPresetPermissionsGroup[];
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
  workspaceId?: string;
}

export interface IPublicPresetPermissionsGroup {
  resourceId: string;
  workspaceId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: string;
  name: string;
  description?: string;
  presets: IAssignedPresetPermissionsGroup[];
  tags: IAssignedTag[];
}

export interface IPresetInput {
  presetId: string;
  order?: number;
}
