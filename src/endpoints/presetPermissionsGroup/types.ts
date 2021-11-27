import {IAgent} from '../../definitions/system';

export interface IPublicPresetPermissionsItem {
  itemId: string;
  organizationId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedAt?: string;
  lastUpdatedBy?: IAgent;
}

export interface IPresetInput {
  presetId: string;
  order: number;
}
