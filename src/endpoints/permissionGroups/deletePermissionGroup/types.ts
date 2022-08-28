import {IPermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IDeletePermissionGroupEndpointParams = IPermissionGroupMatcher;

export type DeletePermissionGroupEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionGroupEndpointParams
>;
