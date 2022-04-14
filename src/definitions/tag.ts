import {IAgent} from './system';

export interface ITag {
  resourceId: string;
  name: string;
  description?: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  workspaceId: string;
}

export interface IAssignedTagInput {
  tagId: string;
}

export interface IAssignedTag {
  tagId: string;
  assignedAt: Date | string;
  assignedBy: IAgent;
}

export type IPublicTag = ITag;
