import {
  PermissionEntityInheritanceMap,
  PermissionGroup,
} from '../../../definitions/permissionGroups.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
} from '../../../definitions/permissionItem.js';
import {Resource} from '../../../definitions/system.js';
import {
  SemanticProviderOpParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';

export type SemanticPermissionProviderType_GetPermissionItemsProps = {
  entityId?: string | string[];
  action?: FimidaraPermissionAction | FimidaraPermissionAction[];
  targetParentId?: string;
  targetId?: string | string[];
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
  action?: FimidaraPermissionAction | FimidaraPermissionAction[];
  targetId?: string | string[];
};

export interface SemanticPermissionProviderType {
  getEntityAssignedPermissionGroups(
    props: {workspaceId: string; entityId: string; fetchDeep?: boolean},
    options?: SemanticProviderQueryListParams<PermissionGroup>
  ): Promise<{
    permissionGroups: PermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }>;
  getEntityInheritanceMap(
    props: {workspaceId: string; entityId: string; fetchDeep?: boolean},
    options?: SemanticProviderOpParams
  ): Promise<PermissionEntityInheritanceMap>;
  getEntity(
    props: {entityId: string},
    opts?: SemanticProviderQueryParams<Resource>
  ): Promise<Resource | null>;
  getPermissionItems(
    props: SemanticPermissionProviderType_GetPermissionItemsProps,
    options?: SemanticProviderQueryListParams<PermissionItem>
  ): Promise<PermissionItem[]>;
  countPermissionItems(
    props: SemanticPermissionProviderType_CountPermissionItemsProps,
    options?: SemanticProviderOpParams
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
