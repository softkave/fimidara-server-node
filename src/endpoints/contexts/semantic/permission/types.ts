import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionItem} from '../../../../definitions/permissionItem';
import {AppActionType, AppResourceType, Resource} from '../../../../definitions/system';
import {BaseContext} from '../../types';
import {ISemanticDataAccessProviderRunOptions} from '../types';

export interface ISemanticDataAccessPermissionProvider {
  getEntityAssignedPermissionGroups(
    props: {
      context: BaseContext;
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }>;
  getEntityInheritanceMap(
    props: {
      context: BaseContext;
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<PermissionEntityInheritanceMap>;
  getEntity(
    props: {context: BaseContext; entityId: string},
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<Resource | null>;
  getPermissionItems(
    props: {
      context: BaseContext;
      entityId?: string | string[];
      action?: AppActionType | AppActionType[];
      targetId?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];

      /** Sort the permission items by last updated date. */
      sortByDate?: boolean;

      /** Sort the permission items by container, i.e following the order of
       * containers passed. */
      sortByContainer?: boolean;
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<PermissionItem[]>;
  countPermissionItems(
    props: {
      context: BaseContext;
      entityId?: string | string[];
      action?: AppActionType | AppActionType[];
      targetId?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<number>;
}
