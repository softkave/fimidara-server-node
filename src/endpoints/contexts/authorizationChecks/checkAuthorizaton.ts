import {compact, isUndefined} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IPermissionItem} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  getWorkspaceResourceTypeList,
  ISessionAgent,
} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {makeKey, toArray} from '../../../utils/fns';
import {logger} from '../../../utils/logger/logger';
import {getResourceTypeFromId} from '../../../utils/resourceId';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../user/errors';
import {IBaseContext} from '../types';

export type AuthTarget = {
  type?: AppResourceType;
  targetId?: string;
};

export interface ICheckAuthorizationParams {
  context: IBaseContext;
  agent: ISessionAgent;
  workspaceId: string;
  containerId?: string | string[];
  targets: AuthTarget | Array<AuthTarget>;
  action: BasicCRUDActions;
}

type AccessMap = Partial<Record<string, IPermissionItem>>;

function newAccessChecker(
  itemsAllowingAccess: AccessMap,
  itemsDenyingAccess: AccessMap,
  keyFn: (item: Pick<IPermissionItem, 'targetId' | 'targetType' | 'action'>) => string[]
) {
  const handleNoAccess = (item?: IPermissionItem, nothrow = false) => {
    if (nothrow) return item ?? false;
    throw new PermissionDeniedError();
  };

  const findItem = (keys: string[], map: AccessMap) => {
    for (const key of keys) {
      const item = map[key];
      if (item) return item;
    }
    return false;
  };

  const reportConflictingAccess = (
    accessItem: IPermissionItem,
    denyItem: IPermissionItem,
    action: BasicCRUDActions,
    targetType: AppResourceType,
    targetId?: string
  ) => {
    logger.error(
      `Conflicting permission items ${accessItem.resourceId} and ${denyItem.resourceId} when resolving action ${action} for target type ${targetType} and target ID ${targetId}.`
    );
  };

  const produceCheckResult = (
    keys: string[],
    action: BasicCRUDActions,
    targetType: AppResourceType,
    targetId?: string,
    nothrow = false
  ) => {
    const accessItem = findItem(keys, itemsAllowingAccess);
    const denyItem = findItem(keys, itemsDenyingAccess);

    if (accessItem && denyItem)
      reportConflictingAccess(accessItem, denyItem, action, targetType, targetId);
    if (denyItem) return handleNoAccess(denyItem, nothrow);
    if (accessItem) return accessItem;

    return handleNoAccess(undefined, nothrow);
  };

  const accessChecker = {
    checkForTargetId: (action: BasicCRUDActions, targetId: string, nothrow = false) => {
      const type = getResourceTypeFromId(targetId);
      const keys = keyFn({action, targetId, targetType: type});
      return produceCheckResult(keys, action, type, targetId, nothrow);
    },
    checkForTargetType: (action: BasicCRUDActions, type: AppResourceType, nothrow = false) => {
      const keys = keyFn({action, targetType: type});
      return produceCheckResult(keys, action, type, undefined, nothrow);
    },
    checkUsingCheckAuthParams: ({
      targets,
      action,
    }: Pick<ICheckAuthorizationParams, 'targets' | 'action'>) => {
      toArray(targets).forEach(target => {
        if (target.targetId) {
          accessChecker.checkForTargetId(action, target.targetId);
        } else if (target.type) {
          accessChecker.checkForTargetType(action, target.type);
        }
      });
    },
  };

  return accessChecker;
}

export async function getAuthorizationAccessChecker(params: ICheckAuthorizationParams) {
  const {itemsAllowingAccess, itemsDenyingAccess, getItemAccessKeys} =
    await fetchAndSortAgentPermissionItems(params);
  return newAccessChecker(itemsAllowingAccess, itemsDenyingAccess, getItemAccessKeys);
}

export async function checkAuthorization(params: ICheckAuthorizationParams) {
  const accessChecker = await getAuthorizationAccessChecker(params);
  accessChecker.checkUsingCheckAuthParams(params);
}

export async function fetchAgentPermissionItems(
  params: ICheckAuthorizationParams & {fetchEntitiesDeep: boolean}
) {
  const {context, agent, workspaceId, targets} = params;
  if (agent.user && !agent.user.isEmailVerified && params.action !== BasicCRUDActions.Read) {
    // Only read actions are permitted for user's who aren't email verified.
    throw new EmailAddressNotVerifiedError();
  }

  appAssert(
    Array.isArray(targets) ? targets.length > 0 : targets,
    new ServerError(),
    'Provide atleast one target.'
  );
  const map = await context.semantic.permissions.getEntityInheritanceMap({
    context,
    entityId: agent.agentId,
    fetchDeep: params.fetchEntitiesDeep,
  });
  const {sortedItemsList} = context.logic.permissions.sortInheritanceMap({
    map,
    entityId: agent.agentId,
  });

  const entityIdList = sortedItemsList.map(item => item.id),
    action = toArray(params.action).concat(BasicCRUDActions.All),
    targetsList = toArray(targets),
    targetId = compact(targetsList.map(item => item.targetId)),
    targetType = compact(targetsList.map(item => item.type)),
    containerId = params.containerId ?? workspaceId;
  const permissionItems = await context.semantic.permissions.getEntitiesPermissionItems({
    context,
    action,
    containerId,
    targetId,
    targetType,
    entityId: entityIdList,
    sortByContainer: true,
    sortByDate: true,
  });
  return permissionItems;
}

export async function fetchAndSortAgentPermissionItems(params: ICheckAuthorizationParams) {
  const permissionItems = await fetchAgentPermissionItems({...params, fetchEntitiesDeep: true});
  return sortOutPermissionItems(permissionItems);
}

/**
 * Assumes permission items are for the same entity and container. If that
 * changes, change this function accordingly.
 */
export function uniquePermissionItems(items: IPermissionItem[]) {
  const map: AccessMap = {};

  const getItemAccessKeys = (item: IPermissionItem) => {
    const actions = item.action === BasicCRUDActions.All ? getWorkspaceActionList() : [item.action];
    const resourceTypes =
      item.targetType === AppResourceType.All ? getWorkspaceResourceTypeList() : [item.targetType];
    const keys: string[] = [];
    actions.forEach(action => {
      resourceTypes.forEach(type =>
        keys.push(makeKey([type, action, item.targetId, item.grantAccess]))
      );
    });
    return keys;
  };

  const processItem = (item: IPermissionItem) => {
    const itemKeys = getItemAccessKeys(item);
    const exists = itemKeys.some(key => map[key]);
    if (exists) {
      return false;
    }

    itemKeys.forEach(key => {
      map[key] = item;
    });
    return true;
  };

  items = items.filter(processItem);
  return {items, getItemAccessKeys, processItem};
}

export function sortOutPermissionItems(items: IPermissionItem[]) {
  const itemsAllowingAccess: AccessMap = {},
    itemsDenyingAccess: AccessMap = {};

  const getItemAccessKeys = (item: Pick<IPermissionItem, 'targetId' | 'targetType' | 'action'>) => {
    const actions = item.action === BasicCRUDActions.All ? getWorkspaceActionList() : [item.action];
    const resourceTypes =
      item.targetType === AppResourceType.All ? getWorkspaceResourceTypeList() : [item.targetType];
    const keys: string[] = [];
    actions.forEach(action => {
      resourceTypes.forEach(type => keys.push(makeKey([type, action, item.targetId])));
    });
    return keys;
  };

  const processItem = (item: IPermissionItem) => {
    const itemKeys = getItemAccessKeys(item);
    const isAccessAllowed = itemKeys.some(key => itemsAllowingAccess[key]);
    if (isAccessAllowed) return false;
    const isAccessDenied = itemKeys.some(key => itemsDenyingAccess[key]);
    if (isAccessDenied) return false;

    if (item.grantAccess) {
      itemKeys.forEach(key => {
        itemsAllowingAccess[key] = item;
      });
    } else {
      itemKeys.forEach(key => {
        itemsDenyingAccess[key] = item;
      });
    }

    return true;
  };

  items = items.filter(item => {
    return processItem(item);
  });
  return {items, itemsAllowingAccess, itemsDenyingAccess, getItemAccessKeys, processItem};
}

export async function summarizeAgentPermissionItems(params: ICheckAuthorizationParams) {
  const {items} = await fetchAndSortAgentPermissionItems(params);
  const allowedResourceIdsMap: Record<string, boolean> = {},
    deniedResourceIdsMap: Record<string, boolean> = {};
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
        scopeInvariantCheck(isUndefined(deniedResourceIdsMap[item.targetId]));
        allowedResourceIdsMap[item.targetId] = true;
      } else {
        scopeInvariantCheck(isUndefined(hasFullOrLimitedAccess));
        hasFullOrLimitedAccess = true;
      }
    } else {
      if (item.targetId) {
        scopeInvariantCheck(isUndefined(allowedResourceIdsMap[item.targetId]));
        deniedResourceIdsMap[item.targetId] = true;
      } else {
        scopeInvariantCheck(isUndefined(hasFullOrLimitedAccess));
        hasFullOrLimitedAccess = false;
      }
    }
  }

  const allowedResourceIdList = Object.keys(allowedResourceIdsMap),
    deniedResourceIdList = Object.keys(deniedResourceIdsMap),
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

export function getWorkspacePermissionContainers(workspaceId: string): string[] {
  return [workspaceId];
}

export function getFilePermissionContainers(workspaceId: string, resource: {idPath: string[]}) {
  const folderIds = resource.idPath
    .filter(id => {
      return getResourceTypeFromId(id) === AppResourceType.Folder;
    })
    .concat(workspaceId);
  return getWorkspacePermissionContainers(workspaceId).concat(folderIds);
}

export function getResourcePermissionContainers(
  workspaceId: string,
  resource?: Pick<IFile, 'idPath'> | {} | null
) {
  if (resource && (resource as Pick<IFile, 'idPath'>).idPath) {
    return getFilePermissionContainers(workspaceId, resource as Pick<IFile, 'idPath'>);
  }
  return getWorkspacePermissionContainers(workspaceId);
}
