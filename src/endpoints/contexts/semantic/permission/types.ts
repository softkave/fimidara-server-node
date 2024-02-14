import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../../definitions/permissionGroups';
import {PermissionAction, PermissionItem} from '../../../../definitions/permissionItem';
import {AppResourceType, Resource} from '../../../../definitions/system';
import {SemanticProviderTxnOptions} from '../types';

export type SemanticPermissionProviderType_GetPermissionItemsProps = {
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

export type SemanticPermissionProviderType_CountPermissionItemsProps = {
  entityId?: string | string[];
  action?: PermissionAction | PermissionAction[];
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
};

export interface SemanticPermissionProviderType {
  getEntityAssignedPermissionGroups(
    props: {
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: SemanticProviderTxnOptions
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }>;
  getEntityInheritanceMap(
    props: {
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: SemanticProviderTxnOptions
  ): Promise<PermissionEntityInheritanceMap>;
  getEntity(
    props: {entityId: string},
    opts?: SemanticProviderTxnOptions
  ): Promise<Resource | null>;
  getPermissionItems(
    props: SemanticPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticProviderTxnOptions
  ): Promise<PermissionItem[]>;
  countPermissionItems(
    props: SemanticPermissionProviderType_CountPermissionItemsProps,
    options?: SemanticProviderTxnOptions
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
