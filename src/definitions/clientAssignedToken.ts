import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';
import {IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IClientAssignedToken {
  resourceId: string;
  providedResourceId?: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  organizationId: string;
  // environmentId: string;
  version: number;
  presets: IAssignedPresetPermissionsGroup[];

  // not same as iat in token, may be a litte bit behind or after
  // and is a ISO string, where iat is time in seconds
  issuedAt: Date | string;
  expires?: Date | string;
  // meta?: Record<string, string | number | boolean | null>;
  // authURL: string;

  tags: IAssignedTag[];
}

export interface IPublicClientAssignedToken {
  resourceId: string;
  providedResourceId?: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  organizationId: string;
  version: number;
  presets: IAssignedPresetPermissionsGroup[];
  issuedAt: string;
  expires?: number;
  tokenStr: string;
  tags: IAssignedTag[];
}
