import {BaseContext} from '../../contexts/types';
import {CountItemsEndpointResult, Endpoint} from '../../types';
import {GetWorkspacePermissionGroupsEndpointParamsBase} from '../getWorkspacePermissionGroups/types';

export type CountWorkspacePermissionGroupsEndpointParams =
  GetWorkspacePermissionGroupsEndpointParamsBase;

export type CountWorkspacePermissionGroupsEndpoint = Endpoint<
  BaseContext,
  CountWorkspacePermissionGroupsEndpointParams,
  CountItemsEndpointResult
>;
