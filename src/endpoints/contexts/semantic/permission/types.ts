import {
  IPermissionGroup,
  PermissionEntityInheritanceMap,
} from '../../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../../definitions/permissionItem';
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
  getEntitiesPermissionItems(props: {
    context: IBaseContext;
    entityId: string[];
    action?: BasicCRUDActions | BasicCRUDActions[];
    targetId?: string | string[];
    strictTargetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];

    /** Sort the permission items by last updated date. */
    sortByDate?: boolean;

    /** Sort the permission items by container, i.e following the order of
     * containers passed. */
    sortByContainer?: boolean;

    /** Sort the permission items by entity, i.e following the order of entity
     * IDs passed. */
    sortByEntity?: boolean;
  }): Promise<IPermissionItem[]>;
  deleteEntitiesPermissionItems(props: {
    context: IBaseContext;
    entityId: string[];
    action?: BasicCRUDActions | BasicCRUDActions[];
    targetId?: string | string[];
    strictTargetId?: string | string[];
    targetType?: AppResourceType | AppResourceType[];
    containerId?: string | string[];
  }): Promise<void>;
}
