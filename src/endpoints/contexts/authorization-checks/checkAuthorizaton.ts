import {flatten, last} from 'lodash';
import {
  IPermissionItem,
  PermissionItemAppliesTo,
} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {InternalError} from '../../../utilities/errors';
import {indexArray} from '../../../utilities/indexArray';
import {
  EmailAddressNotVerifiedError,
  PermissionDeniedError,
} from '../../user/errors';
import {DataProviderFilterValueOperator} from '../data-providers/DataProvider';
import DataProviderFilterBuilder from '../data-providers/DataProviderFilterBuilder';
import {IBaseContext} from '../types';
import {fetchAndSortPermissionGroups} from './fetchPermissionGroups';
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
  workspace: IWorkspace;
  type: AppResourceType;
  itemResourceId?: string;
  permissionOwners: IPermissionOwner[];
  action: BasicCRUDActions;
  nothrow?: boolean;
  resource?: {resourceId: string} | null;
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
    workspace,
    type,
    permissionOwners,
    action,
    nothrow,
    resource,
  } = params;

  if (
    agent.user &&
    action !== BasicCRUDActions.Read &&
    !agent.user.isEmailVerified
  ) {
    // Reject request if user is not verified and action is not read
    throw new EmailAddressNotVerifiedError();
  }

  const itemResourceId = params.resource?.resourceId || params.itemResourceId;

  if (
    resource &&
    params.itemResourceId &&
    resource.resourceId !== params.itemResourceId
  ) {
    throw new InternalError("Resource ID doesn't match item resource ID");
  }

  function newFilter() {
    return new DataProviderFilterBuilder<IPermissionItem>();
  }

  const agentPermissionEntities = getPermissionEntities(agent, workspace);
  const authEntities = await fetchAndSortPermissionGroups(
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

  const getEntityKey = (item: IPermissionEntity) =>
    `${item.permissionEntityId}-${item.permissionEntityType}`;

  const entitiesMap = indexArray(authEntities, {
    indexer: getEntityKey,
  });

  const getPermissionOwnerOrder = (item: IPermissionOwner) =>
    entitiesMap[getPermissionOwnerKey(item)]?.order ?? Number.MAX_SAFE_INTEGER;

  const hasPermissionOwners = permissionOwners.length > 0;
  const items = flatten(permissionItemsList).filter(item => {
    if (item.itemResourceId && item.itemResourceId !== itemResourceId) {
      return false;
    } else if (
      item.appliesTo === PermissionItemAppliesTo.Owner &&
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
    [AppResourceType.PermissionGroup]: 4,
  };

  const LOWER_PRIORITY_WEIGHT = Number.MAX_SAFE_INTEGER;
  const HIGHER_PRIORITY_WEIGHT = Number.MIN_SAFE_INTEGER;
  const getEntityOrder = (item: IPermissionEntity) =>
    entitiesMap[getEntityKey(item)]?.order ?? LOWER_PRIORITY_WEIGHT;

  const getEntityWeight = (item: IPermissionEntity) =>
    entityTypeWeight[item.permissionEntityType] ?? LOWER_PRIORITY_WEIGHT;

  const isForOwner = (item: IPermissionItem) =>
    resource &&
    item.appliesTo === PermissionItemAppliesTo.Owner &&
    item.permissionOwnerId === resource.resourceId;

  items.sort((item1, item2) => {
    if (item1.permissionEntityId === item2.permissionEntityId) {
      if (isForOwner(item1)) {
        return HIGHER_PRIORITY_WEIGHT;
      } else if (isForOwner(item2)) {
        return LOWER_PRIORITY_WEIGHT;
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

  if (!item0.grantAccess) {
    throwAuthorizationError();
    return false;
  }

  return true;
}

export function makeWorkspacePermissionOwnerList(workspaceId: string) {
  return [
    {
      permissionOwnerId: workspaceId,
      permissionOwnerType: AppResourceType.Workspace,
      order: 1,
    },
  ];
}

// TODO: write a more performant function
export function getFilePermissionOwners(
  workspaceId: string,
  resource: {idPath: string[]},
  type: AppResourceType.Folder | AppResourceType.File
) {
  let permissionOwners: IPermissionOwner[] =
    makeWorkspacePermissionOwnerList(workspaceId);

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

  return permissionOwners.map((item, index) => ({...item, order: index}));
}

export function makeResourcePermissionOwnerList(
  workspaceId: string,
  type: AppResourceType,
  resource: any
) {
  if (type === AppResourceType.Folder || type === AppResourceType.File) {
    return getFilePermissionOwners(workspaceId, resource, type);
  }

  return makeWorkspacePermissionOwnerList(workspaceId);
}
