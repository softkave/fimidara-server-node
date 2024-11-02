import {CountItemsEndpointResult, Endpoint} from '../../types.js';
import {GetPermissionGroupsEndpointParamsBase} from '../getPermissionGroups/types.js';

export type CountPermissionGroupsEndpointParams =
  GetPermissionGroupsEndpointParamsBase;

export type CountPermissionGroupsEndpoint = Endpoint<
  CountPermissionGroupsEndpointParams,
  CountItemsEndpointResult
>;
