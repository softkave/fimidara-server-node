import {flatten, isUndefined} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  getWorkspaceResourceTypeList,
  ISessionAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {InternalError, ServerError} from '../../../utils/errors';
import {makeKey} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../user/errors';
import {DataProviderFilterValueOperator} from '../DataProvider';
import DataProviderFilterBuilder from '../DataProviderFilterBuilder';
import {IBaseContext} from '../types';
import {fetchAndSortPermissionGroups} from './fetchPermissionGroups';
import {getPermissionEntities, IPermissionEntity} from './getPermissionEntities';

export interface IPermissionContainer {
  containerId: string;
  containerType: AppResourceType;
  order?: number;
}

export interface ICheckAuthorizationParams {
  context: IBaseContext;
  agent: ISessionAgent;
  workspace: IWorkspace;
  type: AppResourceType;
  targetId?: string;
  permissionContainers: IPermissionContainer[];
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
// Possible fix is to segment permission items by containers and only use
// the permission items of the closest possible container if a combination
// of action and resource type/ID match.

export async function checkAuthorization(params: ICheckAuthorizationParams) {
  const {nothrow} = params;
  const items = await fetchAgentPermissionItems(params);

  const decideThrowAuthorizationError = () => {
    if (nothrow) return;
    throw new PermissionDeniedError();
  };

  if (items.length === 0) {
    decideThrowAuthorizationError();
    return false;
  }

  const item0 = items[0];
  if (!item0.grantAccess) {
    decideThrowAuthorizationError();
    return false;
  }

  return true;
}

export async function fetchAgentPermissionItems(params: ICheckAuthorizationParams) {
  const {context, agent, workspace, type, permissionContainers, action, resource} = params;
  if (agent.user && !agent.user.isEmailVerified && action !== BasicCRUDActions.Read) {
    // Only read actions are permitted for user's not email verified
    throw new EmailAddressNotVerifiedError();
  }

  const targetId = params.resource?.resourceId || params.targetId;
  if (resource && params.targetId && resource.resourceId !== params.targetId) {
    throw new InternalError("Resource ID doesn't match item resource ID");
  }

  const agentPermissionEntities = getPermissionEntities(agent, workspace);
  const authEntities = await fetchAndSortPermissionGroups(context, agentPermissionEntities);
  const queries = authEntities.map(item => {
    return new DataProviderFilterBuilder<IPermissionItem>()
      .addItem('permissionEntityId', item.permissionEntityId, DataProviderFilterValueOperator.Equal)
      .addItem(
        'permissionEntityType',
        item.permissionEntityType,
        DataProviderFilterValueOperator.Equal
      )
      .addItem('targetType', [AppResourceType.All, type], DataProviderFilterValueOperator.In)
      .addItem('action', [BasicCRUDActions.All, action], DataProviderFilterValueOperator.In)
      .build();
  });
  const permissionItemsList = await Promise.all(
    queries.map(query => context.data.permissionItem.getManyByQuery(query))
  );

  const getPermissionContainerKey = (item: IPermissionContainer) => item.containerId;
  const getEntityKey = (item: IPermissionEntity) => item.permissionEntityId;
  const getPermissionContainerOrder = (item: IPermissionContainer) =>
    entitiesMap[getPermissionContainerKey(item)]?.order ?? Number.MAX_SAFE_INTEGER;

  const permissionContainersMap = indexArray(permissionContainers, {
    indexer: getPermissionContainerKey,
  });
  const entitiesMap = indexArray(authEntities, {
    indexer: getEntityKey,
  });
  const hasPermissionContainers = permissionContainers.length > 0;
  const items = flatten(permissionItemsList).filter(item => {
    if (item.targetId && item.targetId !== targetId) {
      return false;
    } else if (
      item.appliesTo === PermissionItemAppliesTo.Container &&
      item.containerId !== targetId
    ) {
      return false;
    }

    const permissionContainerKey = getPermissionContainerKey(item);
    const permissionContainerExists = !!permissionContainersMap[permissionContainerKey];
    if (hasPermissionContainers && !permissionContainerExists) {
      return false;
    }

    return true;
  });

  const LOWER_PRIORITY_WEIGHT = Number.MAX_SAFE_INTEGER;
  const HIGHER_PRIORITY_WEIGHT = 0;
  const entityTypeWeight: Record<string, number> = {
    [AppResourceType.User]: 1,
    [AppResourceType.ClientAssignedToken]: 2,
    [AppResourceType.ProgramAccessToken]: 3,
    [AppResourceType.PermissionGroup]: 4,
  };

  const getEntityOrder = (item: IPermissionEntity) =>
    entitiesMap[getEntityKey(item)]?.order ?? LOWER_PRIORITY_WEIGHT;
  const getEntityWeight = (item: IPermissionEntity) =>
    entityTypeWeight[item.permissionEntityType] ?? LOWER_PRIORITY_WEIGHT;

  // TODO: test that container permissions only apply to container, and so...
  const isPermissionItemForContainer = (item: IPermissionItem) =>
    resource &&
    item.appliesTo === PermissionItemAppliesTo.Container &&
    item.containerId === resource.resourceId;

  items.sort((item01, item02) => {
    if (item01.permissionEntityId === item02.permissionEntityId) {
      if (isPermissionItemForContainer(item01)) {
        return HIGHER_PRIORITY_WEIGHT;
      } else if (isPermissionItemForContainer(item02)) {
        return LOWER_PRIORITY_WEIGHT;
      }

      return getPermissionContainerOrder(item01) - getPermissionContainerOrder(item02);
    }
    if (item01.permissionEntityType === item02.permissionEntityType) {
      return getEntityOrder(item01) - getEntityOrder(item02);
    } else {
      return getEntityWeight(item01) - getEntityWeight(item02);
    }
  });

  return items;
}

export async function summarizeAgentPermissionItems(params: ICheckAuthorizationParams) {
  const allowAccessItems: Record<string, boolean> = {},
    denyAccessItems: Record<string, boolean> = {};

  const getAccessMapKey = (item: Pick<IPermissionItem, 'targetId' | 'targetType' | 'action'>) => {
    const actions = item.action === BasicCRUDActions.All ? getWorkspaceActionList() : [item.action];
    const resourceTypes =
      item.targetType === AppResourceType.All ? getWorkspaceResourceTypeList() : [item.targetType];
    return flatten(
      actions.map(action => resourceTypes.map(type => makeKey([type, action, item.targetId])))
    );
  };
  const isADecidingPermissionItem = (item: IPermissionItem) => {
    const typeKeys = getAccessMapKey({
      targetType: item.targetType,
      action: item.action,
    });
    const itemKeys = getAccessMapKey(item);
    const keys = typeKeys.concat(itemKeys);
    const isAccessAllowed = keys.some(key => allowAccessItems[key]);
    if (isAccessAllowed) return false;
    const isAccessDenied = keys.some(key => denyAccessItems[key]);
    if (isAccessDenied) return false;

    if (item.grantAccess) {
      itemKeys.forEach(key => {
        allowAccessItems[key] = true;
      });
    } else {
      itemKeys.forEach(key => {
        denyAccessItems[key] = true;
      });
    }

    return true;
  };

  let items = await fetchAgentPermissionItems(params);
  items = items.filter(item => {
    return isADecidingPermissionItem(item);
  });

  const allowedResourceIdMap: Record<string, boolean> = {},
    deniedResourceIdMap: Record<string, boolean> = {};
  let hasFullOrLimitedAccess: boolean | undefined = undefined;

  const scopeInvariantCheck = (shouldBeTrue: boolean) =>
    appAssert(
      shouldBeTrue,
      new ServerError(),
      'Permission items that effect oppositely on the exact same scope ' +
        'should have been sorted out, only one should remain.'
    );

  for (const item of items) {
    if (item.grantAccess) {
      if (item.targetId) {
        scopeInvariantCheck(isUndefined(deniedResourceIdMap[item.targetId]));
        allowedResourceIdMap[item.targetId] = true;
      } else {
        scopeInvariantCheck(isUndefined(hasFullOrLimitedAccess));
        hasFullOrLimitedAccess = true;
      }
    } else {
      if (item.targetId) {
        scopeInvariantCheck(isUndefined(allowedResourceIdMap[item.targetId]));
        deniedResourceIdMap[item.targetId] = true;
      } else {
        scopeInvariantCheck(isUndefined(hasFullOrLimitedAccess));
        hasFullOrLimitedAccess = false;
      }
    }
  }

  const allowedResourceIdList = Object.keys(allowedResourceIdMap),
    deniedResourceIdList = Object.keys(deniedResourceIdMap),
    noAccess =
      !hasFullOrLimitedAccess &&
      allowedResourceIdList.length === 0 &&
      deniedResourceIdList.length === 0;

  if (hasFullOrLimitedAccess) {
    return {hasFullOrLimitedAccess, deniedResourceIdList};
  } else if (noAccess) {
    return {noAccess};
  } else {
    return {allowedResourceIdList};
  }
}

export function makeWorkspacePermissionContainerList(workspaceId: string): IPermissionContainer[] {
  return [
    {
      containerId: workspaceId,
      containerType: AppResourceType.Workspace,
      order: 1,
    },
  ];
}

/**
 *
 * @param workspaceId
 * @param resource
 * @param type
 * @param excludeResourceIdFromContainers - Exclude the resource's ID from
 * returned containers. This is useful for files, since they're not permission
 * containers, or when you don't want the file or folder ID in the returned
 * container list.
 */
export function getFilePermissionContainers(
  workspaceId: string,
  resource: {idPath: string[]},
  type: AppResourceType.Folder | AppResourceType.File,
  excludeResourceIdFromContainers = type === AppResourceType.File
) {
  let permissionContainers = makeWorkspacePermissionContainerList(workspaceId);
  const folderIds = excludeResourceIdFromContainers
    ? resource.idPath.slice(0, resource.idPath.length - 1)
    : resource.idPath;
  permissionContainers = folderIds
    .map(id => ({
      containerId: id,
      containerType: AppResourceType.Folder,
    }))
    .concat(permissionContainers);
  return permissionContainers.map((item, index) => ({...item, order: index}));
}

export function makeResourcePermissionContainerList(
  workspaceId: string,
  type: AppResourceType,
  resource?: Pick<IFile, 'idPath'> | {} | null
) {
  if ((type === AppResourceType.Folder || type === AppResourceType.File) && resource) {
    return getFilePermissionContainers(workspaceId, resource as Pick<IFile, 'idPath'>, type);
  }
  return makeWorkspacePermissionContainerList(workspaceId);
}
