import {IWorkspaceResourceBase} from './system';

export interface IClientAssignedToken extends IWorkspaceResourceBase {
  name?: string;
  description?: string;
  version: number;

  /**
   * not same as iat in token, may be a litte bit behind or after and is a ISO
   * string, where iat is time in seconds
   */
  expires?: number;
}

export type IPublicClientAssignedToken = IWorkspaceResourceBase &
  Pick<IClientAssignedToken, 'name' | 'description' | 'expires'> & {
    tokenStr: string;
  };
