import {flatten} from 'lodash';
import {IOrganization} from '../../../definitions/organization';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  IPublicAccessOp,
  ISessionAgent,
} from '../../../definitions/system';
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

  const hasPermissionOwners = () => permissionOwners.length > 0;
  const permissionOwnerExists = (item: IPermissionItem) =>
    !!permissionOwnersMap[getPermissionOwnerKey(item)];

  const items = flatten(permissionItemsList).filter(item => {
    if (
      resource &&
      item.itemResourceId &&
      item.itemResourceId !== resource.resourceId
    ) {
      return false;
    }

    if (hasPermissionOwners() && !permissionOwnerExists(item)) {
      return false;
    }

    return true;
  });

  const entityTypeWeight: Record<string, number> = {
    [AppResourceType.User]: 1,
    [AppResourceType.ClientAssignedToken]: 3,
    [AppResourceType.ProgramAccessToken]: 4,
    [AppResourceType.PresetPermissionsGroup]: 5,
  };

  const getEntityKey = (item: IPermissionEntity) =>
    `${item.permissionEntityId}-${item.permissionEntityType}`;

  const entitiesMap = indexArray(authEntities, {
    indexer: getEntityKey,
  });

  const getEntityOrder = (item: IPermissionEntity) =>
    entitiesMap[getEntityKey(item)]?.order ?? 99;

  const getEntityWeight = (item: IPermissionEntity) =>
    entityTypeWeight[item.permissionEntityType] ?? 99;

  const isForOwner = (item: IPermissionItem) =>
    resource &&
    item.isForPermissionOwnerOnly &&
    item.permissionOwnerId === resource.resourceId;

  const lowerWeight = items.length * 2;
  const higherWeight = lowerWeight * -1;
  items.sort((item1, item2) => {
    if (item1.permissionEntityId === item2.permissionEntityId) {
      if (isForOwner(item1)) {
        return higherWeight;
      } else if (isForOwner(item2)) {
        return lowerWeight;
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

export function getFilePermissionOwners(
  organizationId: string,
  file: {idPath: string[]}
) {
  return makeOrgPermissionOwnerList(organizationId).concat(
    file.idPath.map((id, index) => ({
      permissionOwnerId: id,
      permissionOwnerType: AppResourceType.Folder,
      order: index + 2, // +2 cause organizationId is already 1 and index is zero-based
    }))
  );
}
