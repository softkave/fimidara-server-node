import {IAgent} from '../../definitions/system';

export interface IPublicClientAssignedToken {
  tokenId: string;
  createdAt: string;
  createdBy: IAgent;
  organizationId: string;
  environmentId: string;
  version: number;
  issuedAt: string;
  expires?: number;
}
