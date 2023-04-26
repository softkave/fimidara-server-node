import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionItem} from '../../../../definitions/permissionItem';
import {AppActionType, AppResourceType, Resource} from '../../../../definitions/system';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';

export interface SemanticDataAccessPermissionProviderType {
  getEntityAssignedPermissionGroups(
    props: {
      context: BaseContextType;
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: SemanticDataAccessProviderRunOptions
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }>;
  getEntityInheritanceMap(
    props: {
      context: BaseContextType;
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: SemanticDataAccessProviderRunOptions
  ): Promise<PermissionEntityInheritanceMap>;
  getEntity(
    props: {context: BaseContextType; entityId: string},
    opts?: SemanticDataAccessProviderRunOptions
  ): Promise<Resource | null>;
  getPermissionItems(
    props: {
      context: BaseContextType;
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
    options?: SemanticDataAccessProviderRunOptions
  ): Promise<PermissionItem[]>;
  countPermissionItems(
    props: {
      context: BaseContextType;
      entityId?: string | string[];
      action?: AppActionType | AppActionType[];
      targetId?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
    },
    options?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
}
