import {
  Agent,
  FimidaraResourceType,
  PublicWorkspaceResource,
  Resource,
  ToPublicDefinitions,
  TokenAccessScope,
} from './system';

export interface AgentToken extends Resource {
  name?: string;
  description?: string;
  version: number;
  /** Entity agent token was created for, e.g a user. */
  forEntityId: string | null;
  /** Type of resource referenced by `forEntityId`. */
  entityType: FimidaraResourceType;
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
    ToPublicDefinitions<AgentToken>,
    | 'name'
    | 'description'
    | 'expiresAt'
    | 'lastUpdatedBy'
    | 'createdBy'
    | 'providedResourceId'
  > & {
    tokenStr: string;
  };
