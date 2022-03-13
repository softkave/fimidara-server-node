import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';
import {IAgent} from './system';

export interface IProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  hash: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedAt?: Date | string;
  lastUpdatedBy?: IAgent;
  organizationId: string;
  // environmentId: string;
  presets: IAssignedPresetPermissionsGroup[];
}

export interface IPublicProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  organizationId: string;
  presets: IAssignedPresetPermissionsGroup[];
  tokenStr: string;
}
