import {IAgent, IWorkspaceResourceBase} from './system';

export interface ITag extends IWorkspaceResourceBase {
  name: string;
  description?: string;
}

export interface IAssignedTagInput {
  tagId: string;
}

export interface IAssignedTag {
  tagId: string;
  assignedAt: number;
  assignedBy: IAgent;
}

export type IPublicTag = ITag;

/**
 * We aren't launching tags yet, so we want to exclude it for now from endpoint
 * documentations.
 */
export type ExcludeTags<T> = {[K in Exclude<keyof T, 'tags'>]: T[K]};
