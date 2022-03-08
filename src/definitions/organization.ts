import {IAgent} from './system';

export interface IOrganization {
  resourceId: string;
  createdBy: IAgent;
  createdAt: Date | string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  name: string;
  description?: string;
  publicPresetId?: string;
}

export type IPublicOrganization = IOrganization;
