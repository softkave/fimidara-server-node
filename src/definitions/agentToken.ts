import {AppResourceType, IPublicWorkspaceResourceBase, IResourceBase} from './system';

export interface IAgentToken extends IResourceBase {
  name?: string;
  description?: string;
  version: number;
  separateEntityId: string | null;
  agentType: AppResourceType;
  workspaceId: string | null;
  providedResourceId?: string | null;

  /**
   * not same as iat in token, may be a litte bit behind or after and is a ISO
   * string, where iat is time in seconds
   */
  expires?: number;
  accessScope?: string[];
}

export type IPublicAgentToken = IPublicWorkspaceResourceBase &
  Pick<IAgentToken, 'name' | 'description' | 'expires'> & {
    tokenStr: string;
  };
