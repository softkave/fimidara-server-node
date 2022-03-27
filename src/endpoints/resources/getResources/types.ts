import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IFetchResourceItem, IResource} from '../types';

export interface IGetResourcesParams {
  organizationId?: string;
  resources: IFetchResourceItem[];
}

export interface IGetResourcesResult {
  resources: IResource[];
}

export type GetResourcesEndpoint = Endpoint<
  IBaseContext,
  IGetResourcesParams,
  IGetResourcesResult
>;
