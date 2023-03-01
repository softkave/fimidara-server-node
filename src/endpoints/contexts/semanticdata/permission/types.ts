import {
  IPermissionGroup,
  PermissionEntityInheritanceMap,
} from '../../../../definitions/permissionGroups';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, IResourceBase} from '../../../../definitions/system';
import {IBaseContext} from '../../types';

export interface ISemanticDataAccessPermissionProvider {
  getEntityAssignedPermissionGroups(props: {
    context: IBaseContext;
    entityId: string;
    fetchDeep?: boolean;
  }): Promise<{
    permissionGroups: IPermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }>;
  getEntityInheritanceMap(props: {
    context: IBaseContext;
    entityId: string;
    fetchDeep?: boolean;
  }): Promise<PermissionEntityInheritanceMap>;
  getEntity(props: {context: IBaseContext; entityId: string}): Promise<IResourceBase | null>;

  /**
   * Permission items returned are internally sorted after the order of entity
   * IDs passed in. Array of arrays returned follow the same index as
   * `andQueries` if passed, and if not passed, there'll be only on entry for
   * the entities passed.
   */
  getPermissionItemsForEntities(props: {
    context: IBaseContext;
    entities: string[];
    andQueries?: Array<{
      action?: BasicCRUDActions | BasicCRUDActions[];
      targetId?: string | string[];
      targetIdIfPresent?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
      appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
    }>;

    /** Besides sorting by entities' order which is defaultly applied,
     * additionally sort the permission items by last updated date. */
    sortByDate?: boolean;

    /** Besides sorting by entities' order which is defaultly applied,
     * additionally sort the permission items by container, i.e following the
     * order of containers passed to `andQueries` for each query. */
    sortByContainer?: boolean;
  }): Promise<IPermissionItem[][]>;
  deletePermissionItemsForEntities(props: {
    context: IBaseContext;
    entities: string[];
    andQueries?: Array<{
      action?: BasicCRUDActions | BasicCRUDActions[];
      targetId?: string | string[];
      targetIdIfPresent?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
      appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
    }>;
  }): Promise<IPermissionItem[][]>;
}
