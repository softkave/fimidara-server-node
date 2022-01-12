import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAgent} from '../../definitions/system';

export interface IPublicClientAssignedToken {
  resourceId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  organizationId: string;
  version: number;
  presets: IAssignedPresetPermissionsGroup[];
  issuedAt: string;
  expires?: number;
}
