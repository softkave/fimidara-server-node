import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspacePermissionGroupsEndpointParamsBase} from '../getWorkspacePermissionGroups/types';

export type ICountWorkspacePermissionGroupsEndpointParams =
  IGetWorkspacePermissionGroupsEndpointParamsBase;

export type CountWorkspacePermissionGroupsEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspacePermissionGroupsEndpointParams,
  ICountItemsEndpointResult
>;
