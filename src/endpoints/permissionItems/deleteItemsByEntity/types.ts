import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeletePermissionItemsByEntityParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  itemIds: string[];
}

export type DeletePermissionItemsByEntityEndpoint = Endpoint<
  IBaseContext,
  IDeletePermissionItemsByEntityParams
>;
