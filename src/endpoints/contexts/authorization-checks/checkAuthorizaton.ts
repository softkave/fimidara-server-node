import {flatten} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../../definitions/system';
import {indexArray} from '../../../utilities/indexArray';
import {PermissionDeniedError} from '../../user/errors';
import {IBaseContext} from '../BaseContext';
import {DataProviderFilterValueOperator} from '../DataProvider';
import DataProviderFilterBuilder from '../DataProviderFilterBuilder';
import {
  getPermissionEntities,
  IPermissionEntity,
} from './getPermissionEntities';

export interface IPermissionOwner {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  order?: number;
}

export async function checkAuthorization(
  ctx: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  id: string | null,
  type: AppResourceType,
  permissionOwners: IPermissionOwner[],
  action: BasicCRUDActions,
  noThrow?: boolean
) {
  function newFilter() {
    return new DataProviderFilterBuilder<IPermissionItem>();
  }

  const permissionEntities = getPermissionEntities(agent, organizationId);
  const queries = permissionEntities.map(item => {
    return newFilter()
      .addItem(
        'permissionEntityId',
        item.permissionEntityId,
        DataProviderFilterValueOperator.Equal
      )
      .addItem(
        'permissionEntityType',
        item.permissionEntityType,
        DataProviderFilterValueOperator.Equal
      )
      .addItem('resourceType', type, DataProviderFilterValueOperator.Equal)
      .addItem('action', action, DataProviderFilterValueOperator.Equal)
      .build();
  });

  const itemsList = await Promise.all(
    queries.map(query => ctx.data.permissionItem.getManyItems(query))
  );

  const getPermissionOwnerKey = (item: IPermissionOwner) =>
    `${item.permissionOwnerId}-${item.permissionOwnerType}`;

  const permissionOwnersMap = indexArray(permissionOwners, {
    indexer: getPermissionOwnerKey,
  });

  const getPermissionOwnerOrder = (item: IPermissionOwner) =>
    entitiesMap[getPermissionOwnerKey(item)]?.order ?? 99;

  const hasPermissionOwners = () => permissionOwners.length > 0;
  const permissionOwnerExists = (item: IPermissionItem) =>
    !!permissionOwnersMap[getPermissionOwnerKey(item)];

  const items = flatten(itemsList).filter(item => {
    if (id && item.resourceId && item.resourceId !== id) {
      return false;
    }

    if (hasPermissionOwners() && !permissionOwnerExists(item)) {
      return false;
    }

    return true;
  });

  const entityTypeWeight: Record<string, number> = {
    [AppResourceType.User]: 1,
    // [AppResourceType.UserRole]: 2,
    [AppResourceType.ClientAssignedToken]: 3,
    [AppResourceType.ProgramAccessToken]: 4,
    [AppResourceType.PresetPermissionsGroup]: 5,
  };

  const getEntityKey = (item: IPermissionEntity) =>
    `${item.permissionEntityId}-${item.permissionEntityType}`;

  const entitiesMap = indexArray(permissionEntities, {
    indexer: getEntityKey,
  });

  const getEntityOrder = (item: IPermissionEntity) =>
    entitiesMap[getEntityKey(item)]?.order ?? 99;

  const getEntityWeight = (item: IPermissionEntity) =>
    entityTypeWeight[item.permissionEntityType] ?? 99;

  const isForOwner = (item: IPermissionItem) =>
    id && item.isForPermissionOwnerOnly && item.permissionOwnerId === id;

  items.sort((item1, item2) => {
    if (item1.permissionEntityId === item2.permissionEntityId) {
      if (isForOwner(item1)) {
        return -99;
      } else if (isForOwner(item2)) {
        return 99;
      }

      return getPermissionOwnerOrder(item1) - getPermissionOwnerOrder(item2);
    }

    if (item1.permissionEntityType === item2.permissionEntityType) {
      return getEntityOrder(item1) - getEntityOrder(item2);
    } else {
      return getEntityWeight(item1) - getEntityWeight(item2);
    }
  });

  const throwAuthorizationError = () => {
    if (noThrow) {
      return;
    }

    throw new PermissionDeniedError();
  };

  if (items.length === 0) {
    throwAuthorizationError();
    return false;
  }

  const item0 = items[0];

  if (item0.isExclusion) {
    throwAuthorizationError();
    return false;
  }

  return true;
}

export function makeBasePermissionOwnerList(organizationId: string) {
  return [
    {
      permissionOwnerId: organizationId,
      permissionOwnerType: AppResourceType.Organization,
      order: 1,
    },
  ];
}

export function getFilePermissionOwners(
  organizationId: string,
  file: {idPath: string[]}
) {
  return makeBasePermissionOwnerList(organizationId).concat(
    file.idPath.map((id, i) => ({
      permissionOwnerId: id,
      permissionOwnerType: AppResourceType.Folder,
      order: i + 2, // +2 cause organizationId is already 1 and i is zero-based index
    }))
  );
}