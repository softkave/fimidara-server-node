import {IAssignedPresetPermissionsGroup} from './presetPermissionsItem';
import {IAgent} from './system';

export interface IClientAssignedToken {
  tokenId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  organizationId: string;
  // environmentId: string;
  version: number;
  presets: IAssignedPresetPermissionsGroup[];

  // not same as iat in token, may be a litte bit behind or after
  // and is a ISO string, where iat is time in seconds
  issuedAt: string;
  expires?: number;
  // meta?: Record<string, string | number | boolean | null>;
  // authURL: string;
}
