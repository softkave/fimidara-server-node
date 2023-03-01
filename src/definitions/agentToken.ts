import {AppResourceType, IResourceBase, IWorkspaceResourceBase} from './system';

export interface IAgentToken extends IResourceBase {
  name?: string;
  description?: string;
  version: number;
  agentId: string | null;
  agentType: AppResourceType;
  workspaceId: string | null;

  /**
   * not same as iat in token, may be a litte bit behind or after and is a ISO
   * string, where iat is time in seconds
   */
  expires?: number;
  tokenFor?: string[];
}

export type IPublicAgentToken = IWorkspaceResourceBase &
  Pick<IAgentToken, 'name' | 'description' | 'expires'> & {
    tokenStr: string;
  };
