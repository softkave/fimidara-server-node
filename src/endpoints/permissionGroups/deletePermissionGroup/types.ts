import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {BaseContext} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint} from '../../types';

export type DeletePermissionGroupEndpointParams = PermissionGroupMatcher;

export type DeletePermissionGroupEndpoint = Endpoint<
  BaseContext,
  DeletePermissionGroupEndpointParams,
  LongRunningJobResult
>;
