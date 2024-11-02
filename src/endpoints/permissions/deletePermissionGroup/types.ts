import {PermissionGroupMatcher} from '../../../definitions/permissionGroups.js';
import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint} from '../../types.js';

export type DeletePermissionGroupEndpointParams = PermissionGroupMatcher;

export type DeletePermissionGroupEndpoint = Endpoint<
  DeletePermissionGroupEndpointParams,
  LongRunningJobResult
>;
