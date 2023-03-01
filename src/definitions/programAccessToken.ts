import {IWorkspaceResourceBase} from './system';

export interface IProgramAccessToken extends IWorkspaceResourceBase {
  name: string;
  description?: string;
}

export type IPublicProgramAccessToken = IProgramAccessToken & {tokenStr: string};
