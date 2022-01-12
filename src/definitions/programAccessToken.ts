import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';
import {IAgent} from './system';

export interface IProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  hash: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  organizationId: string;
  // environmentId: string;
  presets: IAssignedPresetPermissionsGroup[];
}
