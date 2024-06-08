import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetWorkspacePermissionGroupsEndpointParamsBase} from '../getWorkspacePermissionGroups/types.js';

export type CountWorkspacePermissionGroupsEndpointParams =
  GetWorkspacePermissionGroupsEndpointParamsBase;

export type CountWorkspacePermissionGroupsEndpoint = Endpoint<
  CountWorkspacePermissionGroupsEndpointParams,
  CountItemsEndpointResult
>;
