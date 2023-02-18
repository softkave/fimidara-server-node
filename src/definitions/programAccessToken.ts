import {IAgent} from './system';

export interface IProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  hash: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  workspaceId: string;
  // environmentId: string;
  // tags: IAssignedTag[];
}

export interface IPublicProgramAccessToken {
  resourceId: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: string;
  workspaceId: string;
  tokenStr: string;
  // tags: IAssignedTag[];
}
