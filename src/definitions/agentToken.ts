import {
  FimidaraResourceType,
  PublicWorkspaceResource,
  ToPublicDefinitions,
  TokenAccessScope,
  WorkspaceResource,
} from './system.js';

export interface AgentToken extends WorkspaceResource {
  name?: string;
  description?: string;
  version: number;
  /** Entity agent token was created for, e.g. a user. */
  forEntityId: string | null;
  /** Type of resource referenced by `forEntityId`. */
  entityType: FimidaraResourceType;
  /** Timestamp in ms */
  expiresAt?: number;
  /** Describes what the token can be used for. */
  scope?: TokenAccessScope[];
  shouldRefresh?: boolean;
  /** Refresh duration in milliseconds */
  refreshDuration?: number;
}

export interface EncodedAgentToken {
  jwtToken: string;
  refreshToken?: string;
  jwtTokenExpiresAt?: number;
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
  > &
  Partial<EncodedAgentToken>;
