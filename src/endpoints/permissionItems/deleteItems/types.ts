import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';
import {
  IPermissionItemInput,
  IPermissionItemInputContainer,
  IPermissionItemInputEntity,
} from '../types';

export type DeletePermissionItemInput = Partial<IPermissionItemInput>;

export interface IDeletePermissionItemsEndpointParams {
  workspaceId?: string;
  entity?: IPermissionItemInputEntity;
  container?: IPermissionItemInputContainer;
  items?: DeletePermissionItemInput[];
  // TODO: implement itemIds: string[]
}

export type DeletePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsEndpointParams,
  ILongRunningJobResult
>;

export type DeletePermissionItemsCascadeFnsArgs = {
  workspaceId: string;
  permissionItemsIdList: string[];
};
