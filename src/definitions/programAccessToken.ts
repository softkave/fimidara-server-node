import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';
import {IAgent} from './system';

export interface IProgramAccessToken {
  tokenId: string;
  hash: string;
  createdAt: string;
  createdBy: IAgent;
  organizationId: string;
  // environmentId: string;
  presets: IAssignedPresetPermissionsGroup[];
}
