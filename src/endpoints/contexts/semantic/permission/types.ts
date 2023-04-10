import {
  IPermissionGroup,
  PermissionEntityInheritanceMap,
} from '../../../../definitions/permissionGroups';
import {IPermissionItem} from '../../../../definitions/permissionItem';
import {AppActionType, AppResourceType, IResource} from '../../../../definitions/system';
import {IBaseContext} from '../../types';
import {ISemanticDataAccessProviderRunOptions} from '../types';

export interface ISemanticDataAccessPermissionProvider {
  getEntityAssignedPermissionGroups(
    props: {
      context: IBaseContext;
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<{
    permissionGroups: IPermissionGroup[];
    inheritanceMap: PermissionEntityInheritanceMap;
  }>;
  getEntityInheritanceMap(
    props: {
      context: IBaseContext;
      entityId: string;
      fetchDeep?: boolean;
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<PermissionEntityInheritanceMap>;
  getEntity(
    props: {context: IBaseContext; entityId: string},
    opts?: ISemanticDataAccessProviderRunOptions
  ): Promise<IResource | null>;
  getPermissionItems(
    props: {
      context: IBaseContext;
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
  ): Promise<IPermissionItem[]>;
  countPermissionItems(
    props: {
      context: IBaseContext;
      entityId?: string | string[];
      action?: AppActionType | AppActionType[];
      targetId?: string | string[];
      targetType?: AppResourceType | AppResourceType[];
      containerId?: string | string[];
    },
    options?: ISemanticDataAccessProviderRunOptions
  ): Promise<number>;
}
