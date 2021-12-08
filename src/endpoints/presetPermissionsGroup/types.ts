import {IAssignedPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {IAgent} from '../../definitions/system';

export interface IPublicPresetPermissionsItem {
  itemId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
  presets: IAssignedPresetPermissionsGroup[];
}

export interface IPresetInput {
  presetId: string;
  order: number;
}
