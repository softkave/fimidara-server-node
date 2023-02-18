import {IAgent} from './system';

export interface IClientAssignedToken {
  resourceId: string;
  providedResourceId?: string | null;
  name?: string;
  description?: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  workspaceId: string;
  version: number;

  // not same as iat in token, may be a litte bit behind or after
  // and is a ISO string, where iat is time in seconds
  // issuedAt: Date | string;
  expires?: Date | string;

  // environmentId: string;
  // meta?: Record<string, string | number | boolean | null>;
  // authURL: string;
  // tags: IAssignedTag[];
  // permissionGroups: IAssignedPermissionGroup[];
}

export interface IPublicClientAssignedToken {
  resourceId: string;
  providedResourceId?: string | null;
  name?: string;
  description?: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: string;
  workspaceId: string;
  // issuedAt: string;
  expires?: string;
  tokenStr: string;
  // tags: IAssignedTag[];
}
