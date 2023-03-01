import {IResourceBase} from './system';

export interface IUserToken extends IResourceBase {
  userId: string;
  version: number;
  tokenFor: string[];
  expires?: number;
}
