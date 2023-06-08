import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionItem, PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {AppActionType, AppResourceType, Resource} from '../../../../definitions/system';
import {BaseContextType} from '../../types';
import {SemanticDataAccessProviderRunOptions} from '../types';

export type SemanticDataAccessPermissionProviderType_GetPermissionItemsProps = {
  context: BaseContextType;
  entityId?: string | string[];
  action?: AppActionType | AppActionType[];
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  containerId?: string | string[];

  /** Sort the permission items by last updated date. */
  sortByDate?: boolean;

  /** Sort the permission items by container, i.e following the order of
   * containers passed. */
  sortByContainer?: boolean;
};
export type SemanticDataAccessPermissionProviderType_CountPermissionItemsProps = {
  context: BaseContextType;
  entityId?: string | string[];
  action?: AppActionType | AppActionType[];
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  containerId?: string | string[];
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
  sortByContainer(
    containerId: string | string[],
    items: PermissionItem[],
    sortByDate?: boolean
  ): PermissionItem[];
}
