import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAgent} from '../../definitions/system';

// TODO: make sure public data use latest versions of their data
export interface IPublicPresetPermissionsGroup {
  presetId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  name: string;
  description?: string;
  presets: IAssignedPresetPermissionsGroup[];
}

export interface IPresetInput {
  presetId: string;
  order: number;
}
