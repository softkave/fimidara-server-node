import {
  Agent,
  AppResourceType,
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  Resource,
  TokenAccessScope,
} from './system';

export interface AgentToken extends Resource {
  name?: string;
  description?: string;
  version: number;
  /** Entity agent token was created for, e.g a user. */
  forEntityId: string | null;
  /** Type of resource referenced by `forEntityId`. */
  entityType: AppResourceType;
  workspaceId: string | null;
  providedResourceId?: string | null;
  lastUpdatedBy: Agent;
  createdBy: Agent;

  /** Timestamp in ms */
  expiresAt?: number;
  /** Describes what the token can be used for. */
  scope?: TokenAccessScope[];
}

export type PublicAgentToken = PublicWorkspaceResource &
  Pick<
    ConvertAgentToPublicAgent<AgentToken>,
    | 'name'
    | 'description'
    | 'expiresAt'
    | 'lastUpdatedBy'
    | 'createdBy'
    | 'providedResourceId'
  > & {
    tokenStr: string;
  };
