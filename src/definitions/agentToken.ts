import {
  AppResourceType,
  ConvertAgentToPublicAgent,
  IAgent,
  IPublicWorkspaceResource,
  IResource,
} from './system';

export interface IAgentToken extends IResource {
  name?: string;
  description?: string;
  version: number;
  separateEntityId: string | null;
  agentType: AppResourceType;
  workspaceId: string | null;
  providedResourceId?: string | null;
  lastUpdatedBy: IAgent;
  createdBy: IAgent;

  /**
   * not same as iat in token, may be a litte bit behind or after and is a ISO
   * string, where iat is time in seconds
   */
  expires?: number;
  scope?: string[];
}

export type IPublicAgentToken = IPublicWorkspaceResource &
  Pick<
    ConvertAgentToPublicAgent<IAgentToken>,
    'name' | 'description' | 'expires' | 'lastUpdatedBy' | 'createdBy'
  > & {
    tokenStr: string;
  };
