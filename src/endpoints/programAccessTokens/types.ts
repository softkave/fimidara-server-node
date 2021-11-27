import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAgent} from '../../definitions/system';

export interface IPublicProgramAccessToken {
  tokenId: string;
  description?: string;
  hash: string;
  createdAt: string;
  createdBy: IAgent;
  organizationId: string;
  presets: IAssignedPresetPermissionsGroup[];
}
