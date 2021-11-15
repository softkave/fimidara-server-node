import {IAgent} from './system';

export const CLIENT_ASSIGNED_TOKEN_VERSION = 1;

export interface IClientAssignedToken {
  tokenId: string;
  createdAt: string;
  createdBy: IAgent;
  organizationId: string;
  environmentId: string;
  // bucketId: string;
  version: number;

  // TODO: implement limitation to certain folders and files

  // not same as iat in token, may be a litte bit behind or after
  // and is a ISO string, where iat is time in seconds
  issuedAt: string;
  expires?: number;
  // meta?: Record<string, string | number | boolean | null>;
  // authURL: string;
}
