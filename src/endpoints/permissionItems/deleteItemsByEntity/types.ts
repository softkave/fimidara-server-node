import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';
import {IPermissionItemInput} from '../types';

export interface IDeletePermissionItemsByEntityEndpointParams {
  workspaceId?: string;
  entityId: string;
  items?: IPermissionItemInput[];
  deleteAllPermissionItems?: boolean;
}

export type DeletePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsByEntityEndpointParams
>;
