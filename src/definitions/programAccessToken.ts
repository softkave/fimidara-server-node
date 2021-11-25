import {IAssignedPresetPermissionsGroup} from './presetPermissionsItem';

export interface IProgramAccessToken {
  tokenId: string;
  hash: string;
  createdAt: string;
  createdBy: string;
  organizationId: string;
  // environmentId: string;
  presets: IAssignedPresetPermissionsGroup[];
}
