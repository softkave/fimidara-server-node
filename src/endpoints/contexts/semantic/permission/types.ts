import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionAction, PermissionItem} from '../../../../definitions/permissionItem';
import {AppResourceType, Resource} from '../../../../definitions/system';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';

export type SemanticDataAccessPermissionProviderType_GetPermissionItemsProps = {
  entityId?: string | string[];
  action?: PermissionAction | PermissionAction[];
  targetParentId?: string;
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  /** Sort the permission items by last updated date. */
  sortByDate?: boolean;
  /** Sort the permission items by target, i.e following the order of
   * `targetId` passed. */
  sortByTarget?: boolean;
  /** Sort the permission items by entity, i.e following the order of
   * `entityId` passed. */
  sortByEntity?: boolean;
};

export type SemanticDataAccessPermissionProviderType_CountPermissionItemsProps = {
  entityId?: string | string[];
  action?: PermissionAction | PermissionAction[];
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
};

export interface SemanticDataAccessPermissionProviderType {
  getEntityAssignedPermissionGroups(
    props: {
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
  sortItems(
    items: PermissionItem[],
    entityId: string | string[] | undefined,
    targetId: string | string[] | undefined,
    sortByEntity?: boolean,
    sortByTarget?: boolean,
    sortByDate?: boolean
  ): PermissionItem[];
}
