import {ConvertAgentToPublicAgent, IAgent, IWorkspaceResource} from './system';

export interface ITag extends IWorkspaceResource {
  name: string;
  description?: string;
}

// TODO: Not the right tag input. Tags should be assigned by name.
export interface IAssignedTagInput {
  tagId: string;
}

export interface IAssignedTag {
  tagId: string;
  assignedAt: number;
  assignedBy: IAgent;
}

export type IPublicTag = ConvertAgentToPublicAgent<ITag>;
export type IPublicAssignedTag = ConvertAgentToPublicAgent<IAssignedTag>;

/**
 * We aren't launching tags yet, so we want to exclude it for now from endpoint
 * documentations.
 */
export type ExcludeTags<T> = {[K in Exclude<keyof T, 'tags'>]: T[K]};
