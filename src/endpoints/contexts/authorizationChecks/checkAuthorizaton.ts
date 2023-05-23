import {difference, flatten, isEmpty, isObject, isUndefined, uniq} from 'lodash';
import {File} from '../../../definitions/file';
import {PermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  Resource,
  SessionAgent,
  getWorkspaceActionList,
  getWorkspaceResourceTypeList,
} from '../../../definitions/system';
import {UserWithWorkspace} from '../../../definitions/user';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {
  defaultArrayTo,
  makeKey,
  toArray,
  toCompactArray,
  toNonNullableArray,
} from '../../../utils/fns';
import {getResourceTypeFromId} from '../../../utils/resource';
import {reuseableErrors} from '../../../utils/reusableErrors';
import {getLogger} from '../../globalUtils';
import {checkResourcesBelongsToWorkspace} from '../../resources/containerCheckFns';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../users/errors';
import {SemanticDataAccessPermissionProviderType_GetPermissionItemsProps} from '../semantic/permission/types';
import {BaseContextType} from '../types';

export type AuthTarget = {
  /** Pass only target ID without target type when checking a single target. */
  targetId?: string;

  /** Pass target ID with target type when checking access to a type. */
  targetType?: AppResourceType;
  containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
};

export interface ICheckAuthorizationParams {
  context: BaseContextType;
  agent?: SessionAgent;
  entity?: string;
  workspaceId: string;
  workspace?: Pick<Workspace, 'publicPermissionGroupId'>;
  containerId?: string | string[];
  targets: AuthTarget | Array<AuthTarget>;
  action: AppActionType;
}

type AccessMap = Partial<Record<string, PermissionItem>>;
export interface IAuthAccessCheckers {
  params: ICheckAuthorizationParams | undefined;
  checkForTargetId: (
    targetId: string,
    action: AppActionType,
    containerId?: string | string[],
    nothrow?: boolean
  ) => {hasAccess: boolean; item?: PermissionItem};
  checkForTargetType: (
    type: AppResourceType,
    action: AppActionType,

    /** container ID should contain immediate parent ID */
    containerId: string | string[],
    nothrow?: boolean
  ) => {hasAccess: boolean; item?: PermissionItem};
  checkUsingCheckAuthParams: (params: ICheckAuthorizationParams) => void;
}

function newAccessChecker(
  itemsAccess: AccessMap,
  keyFn: GetItemAccessKeysFn,
  params: ICheckAuthorizationParams | undefined
) {
  const handleNoAccess = (item?: PermissionItem, nothrow = false) => {
    if (nothrow) return {item, hasAccess: false};
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
    accessItem: PermissionItem,
    denyItem: PermissionItem,
    action: AppActionType,
    targetType: AppResourceType,
    targetId?: string
  ) => {
    getLogger().error(
      `Conflicting permission items ${accessItem.resourceId} and ${denyItem.resourceId} when resolving action ${action} for target type ${targetType} and target ID ${targetId}.`
    );
  };

  const produceCheckResult = (keys: string[], nothrow = false) => {
    const item = findItem(keys, itemsAccess);

    if (isObject(item) && item.grantAccess) {
      return {item, hasAccess: true};
    }

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

      return produceCheckResult(targetKeys.concat(containerKeys), nothrow);
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

      return produceCheckResult(containerKeys, nothrow);
    },
    checkUsingCheckAuthParams(params) {
      toNonNullableArray(params.targets).forEach(target => {
        if (target.targetType) {
          accessChecker.checkForTargetType(
            target.targetType,
            params.action,
            uniq(toCompactArray(params.workspaceId, params.containerId, target.targetId)),
            /** nothrow */ false
          );
        } else if (target.targetId) {
          accessChecker.checkForTargetId(
            target.targetId,
            params.action,

            // Remove target ID from container if present
            uniq(
              difference(toCompactArray(params.workspaceId, params.containerId), [target.targetId])
            ),
            /** nothrow */ false
          );
        }
      });
    },
  };

  return accessChecker;
}

export async function getAuthorizationAccessChecker(params: ICheckAuthorizationParams) {
  const {itemsAccess, getItemAccessKeys} = await fetchAndSortAgentPermissionItems(params);
  return newAccessChecker(itemsAccess, getItemAccessKeys, params);
}

export async function checkAuthorization(params: ICheckAuthorizationParams) {
  const accessChecker = await getAuthorizationAccessChecker(params);
  accessChecker.checkUsingCheckAuthParams(params);
}

export async function fetchAgentPermissionItems(
  params: ICheckAuthorizationParams & {fetchEntitiesDeep: boolean}
) {
  const {context, agent, entity, workspaceId, targets} = params;

  if (agent && agent.user && !agent.user.isEmailVerified && params.action !== AppActionType.Read) {
    // Only read actions are permitted for user's who aren't email verified.
    throw new EmailAddressNotVerifiedError();
  }

  const agentId = agent?.agentId ?? entity;
  appAssert(agentId);

  const workspace =
    params.workspace ?? (await context.semantic.workspace.getOneById(params.workspaceId));
  appAssert(workspace, reuseableErrors.workspace.notFound());
  appAssert(
    Array.isArray(targets) ? targets.length > 0 : targets,
    new ServerError(),
    'Provide atleast one target.'
  );

  const [entityInheritanceMap, publicInheritanceMap] = await Promise.all([
    context.semantic.permissions.getEntityInheritanceMap({
      context,
      entityId: agentId,
      fetchDeep: params.fetchEntitiesDeep,
    }),
    context.semantic.permissions.getEntityInheritanceMap({
      context,
      entityId: workspace.publicPermissionGroupId,
      fetchDeep: params.fetchEntitiesDeep,
    }),
  ]);
  const {sortedItemsList: entitySortedItemList} = context.logic.permissions.sortInheritanceMap({
    map: entityInheritanceMap,
    entityId: agentId,
  });
  const {sortedItemsList: publicSortedItemList} = context.logic.permissions.sortInheritanceMap({
    map: publicInheritanceMap,
    entityId: workspace.publicPermissionGroupId,
  });

  const sortedItemsList = entitySortedItemList.concat(publicSortedItemList),
    entityIdList = sortedItemsList.map(item => item.id),
    action = toNonNullableArray(params.action).concat(AppActionType.All),
    containerId = defaultArrayTo(toCompactArray(params.containerId), workspaceId);

  const qList = toArray(targets).map(t => {
    const targetType: AppResourceType[] = toCompactArray(t.targetType);
    let qTargetId: string | undefined = t.targetId;
    let qContainerId: string[] = containerId;

    if (qTargetId && targetType.length === 0) {
      // If target type is not provided, then we're checking permission for just
      // a single resource identified by targetID. Nonetheless, we need to
      // default target type for containerID queries to avoid a free-for-all
      // scenario.
      targetType.push(getResourceTypeFromId(qTargetId));
    } else if (qTargetId && targetType.length !== 0) {
      // If target type is provided, then we're checking for all the resource
      // under targetID of provided type. So, we can safely add the target ID to
      // the containers, seeing this is a container-only check.
      // TODO: should we uniq targetId and target type?
      qContainerId = qContainerId.concat(qTargetId);
      qTargetId = undefined;
    }

    targetType.push(AppResourceType.All);
    const q: SemanticDataAccessPermissionProviderType_GetPermissionItemsProps = {
      context,
      action,
      targetType,
      containerId: qContainerId,
      targetId: qTargetId,
      entityId: entityIdList,
      targetAppliesTo: t.targetAppliesTo,
      containerAppliesTo: t.containerAppliesTo,
      sortByContainer: true,
      sortByDate: true,
    };
    return q;
  });

  const pItemsList = await Promise.all(
    qList.map(q => context.semantic.permissions.getPermissionItems(q))
  );
  const pItems = flatten(pItemsList);
  return pItems;
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
  items: PermissionItem[],

  /**
   * Set to `true` if you want `create`, `read`, and other actions to fold into
   * wildcard action `*` if present, and same for resource types.
   */
  foldPermissionItems = false
) {
  const map: AccessMap = {};

  const getItemAccessKeys = (item: PermissionItem) => {
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
        keys.push(
          makeKey([type, action, item.targetId, item.grantAccess, item.entityId, item.appliesTo])
        )
      );
    });
    return keys;
  };

  const processItem = (item: PermissionItem) => {
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
  return {items};
}

type GetItemAccessKeysFn = (item: {
  action: AppActionType;
  targetType: AppResourceType;

  /** string for a single target and string[] when considering containers. */
  targetId: string | string[];
  appliesTo: PermissionItemAppliesTo | PermissionItemAppliesTo[];
}) => string[];

export type SortOutPermissionItemsSelectionFn = (p: {
  addedKeys: string[];
  item: PermissionItem;
}) => boolean;

export const sortOutPermissionItemsDefaultSelectionFn: SortOutPermissionItemsSelectionFn = p => {
  return p.addedKeys.length > 0;
};
const workspaceActionList = getWorkspaceActionList();
const workspaceResourceTypeList = getWorkspaceResourceTypeList();

export function sortOutPermissionItems(
  items: PermissionItem[],
  selectionFn: SortOutPermissionItemsSelectionFn = sortOutPermissionItemsDefaultSelectionFn,
  spreadWildcard = true,
  spreadAppliesTo = true
) {
  const itemsAccess: AccessMap = {};

  const getItemAccessKeys: GetItemAccessKeysFn = item => {
    const actions =
      spreadWildcard && item.action === AppActionType.All ? workspaceActionList : [item.action];
    const resourceTypes =
      spreadWildcard && item.targetType === AppResourceType.All
        ? workspaceResourceTypeList
        : [item.targetType];
    const keys: string[] = [];

    // TODO: possibly cache these spreading outs
    actions.forEach(action => {
      resourceTypes.forEach(type =>
        toNonNullableArray(item.targetId).forEach(targetId =>
          toNonNullableArray(item.appliesTo).forEach(appliesTo => {
            if (spreadAppliesTo && appliesTo === PermissionItemAppliesTo.SelfAndChildrenOfType) {
              return keys.push(
                makeKey([targetId, type, action, PermissionItemAppliesTo.Self]),
                makeKey([targetId, type, action, PermissionItemAppliesTo.ChildrenOfType])
              );
            } else {
              return keys.push(makeKey([targetId, type, action, appliesTo]));
            }
          })
        )
      );
    });
    return keys;
  };

  const processItem = (item: PermissionItem) => {
    const itemKeys = getItemAccessKeys(item);
    const addedKeys = itemKeys.filter(key => {
      if (!itemsAccess[key]) {
        itemsAccess[key] = item;
        return true;
      }

      return false;
    });

    const retain = selectionFn({addedKeys, item});
    return retain;
  };

  items = items.filter(item => {
    return processItem(item);
  });
  return {items, itemsAccess, getItemAccessKeys, processItem};
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

  // TODO: how can we short-circuit to end early if an item has full access or
  // full deny
  for (const item of items) {
    if (item.grantAccess) {
      if (item.targetId && item.appliesTo === PermissionItemAppliesTo.Self) {
        scopeInvariantCheck(isUndefined(deniedResourceIdsMap[item.targetId]));
        allowedResourceIdsMap[item.targetId] = true;
      } else {
        scopeInvariantCheck(
          hasFullOrLimitedAccess === undefined || hasFullOrLimitedAccess === true
        );
        hasFullOrLimitedAccess = true;
      }
    } else {
      if (item.targetId && item.appliesTo === PermissionItemAppliesTo.Self) {
        scopeInvariantCheck(isUndefined(allowedResourceIdsMap[item.targetId]));
        deniedResourceIdsMap[item.targetId] = true;
      } else {
        scopeInvariantCheck(
          hasFullOrLimitedAccess === undefined || hasFullOrLimitedAccess === false
        );
        hasFullOrLimitedAccess = false;
      }
    }
  }

  const allowedResourceIdList = !isEmpty(allowedResourceIdsMap)
      ? Object.keys(allowedResourceIdsMap)
      : undefined,
    deniedResourceIdList = !isEmpty(deniedResourceIdsMap)
      ? Object.keys(deniedResourceIdsMap)
      : undefined,
    noAccess =
      !hasFullOrLimitedAccess && isEmpty(allowedResourceIdList) && isEmpty(deniedResourceIdList);

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

export function getFilePermissionContainers(
  workspaceId: string,
  resource: {idPath: string[]},
  includeResourceId = false
) {
  return getWorkspacePermissionContainers(workspaceId).concat(
    resource.idPath.slice(0, includeResourceId ? undefined : -1)
  );
}

export function getResourcePermissionContainers(
  workspaceId: string,
  resource?: Resource | (Resource & Pick<File, 'idPath'>) | null,
  includeResourceId = false
) {
  if (resource && (resource as Pick<File, 'idPath'>).idPath) {
    return getFilePermissionContainers(
      workspaceId,
      resource as Pick<File, 'idPath'>,
      includeResourceId
    );
  } else if (resource && getResourceTypeFromId(resource.resourceId) === AppResourceType.User) {
    const user = resource as unknown as UserWithWorkspace;
    checkResourcesBelongsToWorkspace(workspaceId, [
      {resourceId: user.resourceId, resourceType: AppResourceType.User, resource: user},
    ]);
  }

  return getWorkspacePermissionContainers(workspaceId);
}
