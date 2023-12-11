import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeletePermissionGroupEndpointParams = PermissionGroupMatcher;

export type DeletePermissionGroupEndpoint = Endpoint<
  DeletePermissionGroupEndpointParams,
  LongRunningJobResult
>;
