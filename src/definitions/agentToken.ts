import {
  Agent,
  AppResourceType,
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  Resource,
} from './system';

export interface AgentToken extends Resource {
  name?: string;
  description?: string;
  version: number;
  separateEntityId: string | null;
  agentType: AppResourceType;
  workspaceId: string | null;
  providedResourceId?: string | null;
  lastUpdatedBy: Agent;
  createdBy: Agent;

  /**
   * Timestamp in milliseconds.
   */
  expires?: number;
  scope?: string[];
}

export type PublicAgentToken = PublicWorkspaceResource &
  Pick<
    ConvertAgentToPublicAgent<AgentToken>,
    'name' | 'description' | 'expires' | 'lastUpdatedBy' | 'createdBy'
  > & {
    tokenStr: string;
  };
