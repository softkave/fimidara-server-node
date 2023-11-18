import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionAction, PermissionItem} from '../../../../definitions/permissionItem';
import {AppResourceType, Resource} from '../../../../definitions/system';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';

export type SemanticDataAccessPermissionProviderType_GetPermissionItemsProps = {
  context: BaseContextType;
  entityId?: string | string[];
  action?: PermissionAction | PermissionAction[];
  targetParentId?: string;
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  /** Sort the permission items by last updated date. */
  sortByDate?: boolean;
  /** Sort the permission items by target, i.e following the order of
   * targets passed. */
  sortByTarget?: boolean;
};

export type SemanticDataAccessPermissionProviderType_CountPermissionItemsProps = {
  context: BaseContextType;
  entityId?: string | string[];
  action?: PermissionAction | PermissionAction[];
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
};

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
    props: SemanticDataAccessPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticDataAccessProviderRunOptions
  ): Promise<PermissionItem[]>;
  countPermissionItems(
    props: SemanticDataAccessPermissionProviderType_CountPermissionItemsProps,
    options?: SemanticDataAccessProviderRunOptions
  ): Promise<number>;
  sortByDate(items: PermissionItem[]): PermissionItem[];
  sortByTarget(
    targetId: string | string[],
    items: PermissionItem[],
    sortByDate?: boolean
  ): PermissionItem[];
}
