import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';
import {IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  hash: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  workspaceId: string;

  // environmentId: string;
  // presets: IAssignedPresetPermissionsGroup[];
  // tags: IAssignedTag[];
}

export interface IPublicProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: string;
  workspaceId: string;
  presets: IAssignedPresetPermissionsGroup[];
  tokenStr: string;
  tags: IAssignedTag[];
}
