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
  lastUpdatedAt?: Date | string;
  lastUpdatedBy?: IAgent;
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
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  workspaceId: string;
  presets: IAssignedPresetPermissionsGroup[];
  tokenStr: string;
  tags: IAssignedTag[];
}
