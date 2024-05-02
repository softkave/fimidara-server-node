import {Agent, ToPublicDefinitions, WorkspaceResource} from './system.js';

export interface Tag extends WorkspaceResource {
  name: string;
  description?: string;
}

// TODO: Not the right tag input. Tags should be assigned by name.
export interface AssignedTagInput {
  tagId: string;
}

export interface AssignedTag {
  tagId: string;
  assignedAt: number;
  assignedBy: Agent;
}

export type PublicTag = ToPublicDefinitions<Tag>;
export type PublicAssignedTag = ToPublicDefinitions<AssignedTag>;
