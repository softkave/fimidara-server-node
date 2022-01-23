import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAgent} from '../../definitions/system';

export interface IPublicProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: IAgent;
  organizationId: string;
  presets: IAssignedPresetPermissionsGroup[];
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
}
