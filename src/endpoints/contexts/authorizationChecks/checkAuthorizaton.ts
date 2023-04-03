import {compact, difference, isUndefined, uniq} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  ISessionAgent,
  getWorkspaceActionList,
  getWorkspaceResourceTypeList,
} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {defaultArrayTo, makeKey, toCompactArray, toNonNullableArray} from '../../../utils/fns';
import {getResourceTypeFromId} from '../../../utils/resource';
import {logger} from '../../globalUtils';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../user/errors';
import {IBaseContext} from '../types';

export type AuthTarget = {
  /** Pass only target ID without target type when checking a single target. */
  targetId?: string;

  /** Pass target ID with target type when checking access to a type. */
  targetType?: AppResourceType;
};

export interface ICheckAuthorizationParams {
  context: IBaseContext;
  agent: ISessionAgent;
  workspaceId: string;
  containerId?: string | string[];
  targets: AuthTarget | Array<AuthTarget>;
  action: AppActionType;
}

type AccessMap = Partial<Record<string, IPermissionItem>>;
export interface IAuthAccessCheckers {
  params: ICheckAuthorizationParams | undefined;
  checkForTargetId: (
    targetId: string,
    action: AppActionType,
    containerId?: string | string[],
    nothrow?: boolean
  ) => IPermissionItem | false;
  checkForTargetType: (
    type: AppResourceType,
    action: AppActionType,
    containerId: string | string[],
    nothrow?: boolean
  ) => IPermissionItem | false;
  checkUsingCheckAuthParams: (params: ICheckAuthorizationParams) => void;
}

function newAccessChecker(
  itemsAllowingAccess: AccessMap,
  itemsDenyingAccess: AccessMap,
  keyFn: GetItemAccessKeysFn,
  params: ICheckAuthorizationParams | undefined
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
    action: AppActionType,
    targetType: AppResourceType,
    targetId?: string
  ) => {
    logger.error(
      `Conflicting permission items ${accessItem.resourceId} and ${denyItem.resourceId} when resolving action ${action} for target type ${targetType} and target ID ${targetId}.`
    );
  };

  const produceCheckResult = (
    keys: string[],
    action: AppActionType,
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

  const accessChecker: IAuthAccessCheckers = {
    params,
    checkForTargetId(targetId, action, containerId, nothrow) {
      const type = getResourceTypeFromId(targetId);
      const targetKeys = keyFn({
        action,
        targetId,
        targetType: type,
        appliesTo: [PermissionItemAppliesTo.Self, PermissionItemAppliesTo.SelfAndChildrenOfType],
      });
      const containerKeys = keyFn({
        action,
        targetId: containerId ?? [],
        targetType: type,
        appliesTo: [
          PermissionItemAppliesTo.SelfAndChildrenOfType,
          PermissionItemAppliesTo.ChildrenOfType,
        ],
      });

      return produceCheckResult(targetKeys.concat(containerKeys), action, type, targetId, nothrow);
    },
    checkForTargetType(type, action, containerId, nothrow) {
      const containerKeys = keyFn({
        action,
        targetId: containerId,
        targetType: type,
        appliesTo: [
          PermissionItemAppliesTo.SelfAndChildrenOfType,
          PermissionItemAppliesTo.ChildrenOfType,
        ],
      });

      return produceCheckResult(containerKeys, action, type, undefined, nothrow);
    },
    checkUsingCheckAuthParams(params) {
      toNonNullableArray(params.targets).forEach(target => {
        if (target.targetId) {
          accessChecker.checkForTargetId(
            target.targetId,
            params.action,

            // Remove target ID from container if present
            difference(toNonNullableArray(params.containerId ?? []), [target.targetId]),
            /** nothrow */ false
          );
        } else if (target.targetType) {
          accessChecker.checkForTargetType(
            target.targetType,
            params.action,
            uniq(toCompactArray(params.workspaceId, params.containerId, target.targetId)),
            /** nothrow */ false
          );
        }
      });
    },
  };

  return accessChecker;
}

export async function getAuthorizationAccessChecker(params: ICheckAuthorizationParams) {
  const {itemsAllowingAccess, itemsDenyingAccess, getItemAccessKeys} =
    await fetchAndSortAgentPermissionItems(params);
  return newAccessChecker(itemsAllowingAccess, itemsDenyingAccess, getItemAccessKeys, params);
}

export async function checkAuthorization(params: ICheckAuthorizationParams) {
  const accessChecker = await getAuthorizationAccessChecker(params);
  accessChecker.checkUsingCheckAuthParams(params);
}

export async function fetchAgentPermissionItems(
  params: ICheckAuthorizationParams & {fetchEntitiesDeep: boolean}
) {
  const {context, agent, workspaceId, targets} = params;
  if (agent.user && !agent.user.isEmailVerified && params.action !== AppActionType.Read) {
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
    action = toNonNullableArray(params.action).concat(AppActionType.All),
    targetsList = toNonNullableArray(targets),
    targetId = compact(targetsList.map(item => item.targetId)),
    containerId = defaultArrayTo(toCompactArray(params.containerId), workspaceId);

  let targetType = compact(targetsList.map(item => item.targetType));
  if (!targetType.length && targetId.length) {
    targetType = targetId.map(getResourceTypeFromId);
  }
  targetType.push(AppResourceType.All);
  targetType = uniq(targetType);

  const permissionItems = await context.semantic.permissions.getPermissionItems({
    context,
    containerId,
    targetId,
    targetType,
    action,
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
export function uniquePermissionItems(
  items: IPermissionItem[],

  /**
   * Set to `true` if you want `create`, `read`, and other actions to fold into
   * wildcard action `*` if present, and same for resource types.
   */
  foldPermissionItems = false
) {
  const map: AccessMap = {};

  const getItemAccessKeys = (item: IPermissionItem) => {
    const actions =
      foldPermissionItems && item.action === AppActionType.All
        ? getWorkspaceActionList()
        : [item.action];
    const resourceTypes =
      foldPermissionItems && item.targetType === AppResourceType.All
        ? getWorkspaceResourceTypeList()
        : [item.targetType];
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

type GetItemAccessKeysFn = (item: {
  action: AppActionType;
  targetType: AppResourceType;

  /** string for a single target and string[] when considering containers. */
  targetId: string | string[];
  appliesTo: PermissionItemAppliesTo | PermissionItemAppliesTo[];
}) => string[];

export type SortOutPermissionItemsSelectionFn = (p: {
  isAccessAllowed: boolean;
  isAccessDenied: boolean;
  item: IPermissionItem;
}) => boolean;

const defaultSelectionFn: SortOutPermissionItemsSelectionFn = p => {
  return !(p.isAccessAllowed || p.isAccessDenied);
};

export function sortOutPermissionItems(
  items: IPermissionItem[],
  selectionFn: SortOutPermissionItemsSelectionFn = defaultSelectionFn
) {
  const itemsAllowingAccess: AccessMap = {},
    itemsDenyingAccess: AccessMap = {};

  const getItemAccessKeys: GetItemAccessKeysFn = item => {
    const actions = item.action === AppActionType.All ? getWorkspaceActionList() : [item.action];
    const resourceTypes =
      item.targetType === AppResourceType.All ? getWorkspaceResourceTypeList() : [item.targetType];
    const keys: string[] = [];
    actions.forEach(action => {
      resourceTypes.forEach(type =>
        toNonNullableArray(item.targetId).forEach(targetId =>
          toNonNullableArray(item.appliesTo).forEach(appliesTo =>
            keys.push(makeKey([targetId, type, action, appliesTo]))
          )
        )
      );
    });
    return keys;
  };

  const processItem = (item: IPermissionItem) => {
    const itemKeys = getItemAccessKeys(item);
    const isAccessAllowed = itemKeys.some(key => itemsAllowingAccess[key]);
    const isAccessDenied = itemKeys.some(key => itemsDenyingAccess[key]);
    const retain = selectionFn({isAccessAllowed, isAccessDenied, item});

    if (retain) {
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
    } else {
      return false;
    }
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
  return getWorkspacePermissionContainers(workspaceId).concat(resource.idPath);
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
