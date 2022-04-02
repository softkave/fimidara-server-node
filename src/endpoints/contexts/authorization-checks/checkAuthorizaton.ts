import {flatten, last} from 'lodash';
import {IOrganization} from '../../../definitions/organization';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  IPublicAccessOp,
  ISessionAgent,
} from '../../../definitions/system';
import {ServerError} from '../../../utilities/errors';
import {indexArray} from '../../../utilities/indexArray';
import {PermissionDeniedError} from '../../user/errors';
import {IBaseContext} from '../BaseContext';
import {DataProviderFilterValueOperator} from '../data-providers/DataProvider';
import DataProviderFilterBuilder from '../data-providers/DataProviderFilterBuilder';
import {fetchAndSortPresets} from './fetchPresets';
import {
  getPermissionEntities,
  IPermissionEntity,
} from './getPermissionEntities';

export interface IPermissionOwner {
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  order?: number;
}

export interface ICheckAuthorizationParams {
  context: IBaseContext;
  agent: ISessionAgent;
  organization: IOrganization;
  type: AppResourceType;
  itemResourceId?: string;
  permissionOwners: IPermissionOwner[];
  action: BasicCRUDActions;
  nothrow?: boolean;
  resource?: {resourceId: string; publicAccessOps?: IPublicAccessOp[]};
}

// TODO: What happens if there are permission items that both allow
// and disallow at the same time?

// TODO: There's an issue where say if a folder is public and it allows
// public read of it's files, if we proceed to make a child file, but
// mark it as not public, it is still treated as public cause the parent
// folder's permission items are also used in determining access to the
// resource.
// Possible fix is to segment permission items by owners and only use
// the permission items of the closest possible owner if a combination
// of action and resource type/ID match.

// TODO: make checkAuthorization more performant

export async function checkAuthorization(params: ICheckAuthorizationParams) {
  const {
    context,
    agent,
    organization,
    type,
    permissionOwners,
    action,
    nothrow,
    resource,
  } = params;

  const itemResourceId = params.resource?.resourceId || params.itemResourceId;

  if (
    resource &&
    params.itemResourceId &&
    resource.resourceId !== params.itemResourceId
  ) {
    // TODO: throw invalid argument error instead
    throw new ServerError();
  }

  // Check if resource is public and short-circuit.
  if (
    resource?.publicAccessOps &&
    resource.publicAccessOps.find(
      op => op.action === action && op.resourceType === type
    )
  ) {
    return true;
  }

  function newFilter() {
    return new DataProviderFilterBuilder<IPermissionItem>();
  }

  const agentPermissionEntities = getPermissionEntities(agent, organization);
  const authEntities = await fetchAndSortPresets(
    context,
    agentPermissionEntities
  );

  const queries = authEntities.map(item => {
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
      .addItem(
        'itemResourceType',
        [AppResourceType.All, type],
        DataProviderFilterValueOperator.In
      )
      .addItem(
        'action',
        [BasicCRUDActions.All, action],
        DataProviderFilterValueOperator.In
      )
      .build();
  });

  const permissionItemsList = await Promise.all(
    queries.map(query => context.data.permissionItem.getManyItems(query))
  );

  const getPermissionOwnerKey = (item: IPermissionOwner) =>
    `${item.permissionOwnerId}-${item.permissionOwnerType}`;

  const permissionOwnersMap = indexArray(permissionOwners, {
    indexer: getPermissionOwnerKey,
  });

  const getPermissionOwnerOrder = (item: IPermissionOwner) =>
    entitiesMap[getPermissionOwnerKey(item)]?.order ?? 99;

  const hasPermissionOwners = permissionOwners.length > 0;
  const items = flatten(permissionItemsList).filter(item => {
    // if (
    //   resource &&
    //   item.itemResourceId &&
    //   item.itemResourceId !== resource.resourceId
    // ) {
    //   return false;
    // }

    if (item.itemResourceId && item.itemResourceId !== itemResourceId) {
      return false;
    } else if (
      item.isForPermissionOwnerOnly &&
      item.permissionOwnerId !== itemResourceId
    ) {
      return false;
    }

    const permissionOwnerKey = getPermissionOwnerKey(item);
    const permissionOwnerExists = !!permissionOwnersMap[permissionOwnerKey];

    if (hasPermissionOwners && !permissionOwnerExists) {
      return false;
    }

    return true;
  });

  const entityTypeWeight: Record<string, number> = {
    [AppResourceType.User]: 1,
    [AppResourceType.ClientAssignedToken]: 2,
    [AppResourceType.ProgramAccessToken]: 3,
    [AppResourceType.PresetPermissionsGroup]: 4,
  };

  const getEntityKey = (item: IPermissionEntity) =>
    `${item.permissionEntityId}-${item.permissionEntityType}`;

  const entitiesMap = indexArray(authEntities, {
    indexer: getEntityKey,
  });

  const lowerPriorityWeight = items.length * 2;
  const higherPriorityWeight = lowerPriorityWeight * -1;
  const getEntityOrder = (item: IPermissionEntity) =>
    entitiesMap[getEntityKey(item)]?.order ?? lowerPriorityWeight;

  const getEntityWeight = (item: IPermissionEntity) =>
    entityTypeWeight[item.permissionEntityType] ?? lowerPriorityWeight;

  const isForOwner = (item: IPermissionItem) =>
    resource &&
    item.isForPermissionOwnerOnly &&
    item.permissionOwnerId === resource.resourceId;

  items.sort((item1, item2) => {
    if (item1.permissionEntityId === item2.permissionEntityId) {
      if (isForOwner(item1)) {
        return higherPriorityWeight;
      } else if (isForOwner(item2)) {
        return lowerPriorityWeight;
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
    if (nothrow) {
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

export function makeOrgPermissionOwnerList(organizationId: string) {
  return [
    {
      permissionOwnerId: organizationId,
      permissionOwnerType: AppResourceType.Organization,
      order: 1,
    },
  ];
}

// TODO: write a more performant function
export function getFilePermissionOwners(
  organizationId: string,
  resource: {idPath: string[]},
  type: AppResourceType.Folder | AppResourceType.File
) {
  let permissionOwners: IPermissionOwner[] =
    makeOrgPermissionOwnerList(organizationId);

  const folderIds =
    type === AppResourceType.File
      ? resource.idPath.slice(0, resource.idPath.length - 1) // End index is non-inclusive
      : resource.idPath;

  permissionOwners = folderIds
    .map(id => ({
      permissionOwnerId: id,
      permissionOwnerType: AppResourceType.Folder,
    }))
    .concat(permissionOwners);

  if (type === AppResourceType.File) {
    permissionOwners = [
      {
        permissionOwnerId: last(resource.idPath) as string,
        permissionOwnerType: AppResourceType.File,
      },
    ].concat(permissionOwners);
  }

  // if (type === AppResourceType.File) {
  //   resource.idPath.forEach((id) => {
  //     if (i === resource.idPath.length) {
  //       permissionOwners.push({
  //         permissionOwnerId: id,
  //         permissionOwnerType: AppResourceType.File,
  //       });
  //     } else {
  //       permissionOwners.push({
  //         permissionOwnerId: id,
  //         permissionOwnerType: AppResourceType.Folder,
  //       });
  //     }
  //   });
  // } else {
  //   resource.idPath.forEach((id, i) => {
  //     permissionOwners.push({
  //       permissionOwnerId: id,
  //       permissionOwnerType: AppResourceType.Folder,
  //     });
  //   });
  // }

  return permissionOwners.map((item, index) => ({...item, order: index}));
}

export function makeResourcePermissionOwnerList(
  organizationId: string,
  type: AppResourceType,
  resource: any
) {
  if (type === AppResourceType.Folder || type === AppResourceType.File) {
    return getFilePermissionOwners(organizationId, resource, type);
  }

  return makeOrgPermissionOwnerList(organizationId);
}
