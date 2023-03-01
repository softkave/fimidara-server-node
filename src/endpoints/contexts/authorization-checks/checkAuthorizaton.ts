import {first, isUndefined} from 'lodash';
import {format} from 'util';
import {IFile} from '../../../definitions/file';
import {IPermissionItem, PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
  getWorkspaceResourceTypeList,
  ISessionAgent,
} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {makeKey, stopControlFlow, toArray} from '../../../utils/fns';
import {getResourceTypeFromId} from '../../../utils/resourceId';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../user/errors';
import {IBaseContext} from '../types';

export interface IPermissionContainer {
  containerId: string;
  containerType: AppResourceType;
  order?: number;
}

export type AuthTarget = {
  type?: AppResourceType;
  targetId?: string;
  containerId?: string | string[];
};

export interface ICheckAuthorizationParams {
  context: IBaseContext;
  agent: ISessionAgent;
  workspaceId: string;
  targets: Array<AuthTarget>;
  action: BasicCRUDActions;
  nothrow?: boolean;
}

export function newAccessChecker(
  params: Pick<ICheckAuthorizationParams, 'nothrow' | 'targets'>,
  pItemsList: IPermissionItem[][]
) {
  const {nothrow} = params;

  const handleNoAccess = () => {
    if (nothrow) return false;
    throw new PermissionDeniedError();
  };

  const checkHasAccessWithItems = (items: IPermissionItem[]) => {
    if (items.length === 0) {
      return handleNoAccess();
    }

    const item0 = items[0];
    if (!item0.grantAccess) {
      return handleNoAccess();
    }

    return item0;
  };

  const accessChecker = {
    pItemsList,
    checkFirstTarget: () => {
      return checkHasAccessWithItems(first(pItemsList) ?? []);
    },
    checkForTargetId: (targetId: string) => {
      const type = getResourceTypeFromId(targetId);
      const i = params.targets.findIndex(t => {
        return t.targetId === targetId || (!t.targetId && t.type === type);
      });
      const items = pItemsList[i];
      return checkHasAccessWithItems(items);
    },
    checkForTargetType: (type: AppResourceType) => {
      const i = params.targets.findIndex(t => {
        return !t.targetId && t.type === type;
      });
      const items = pItemsList[i];
      return checkHasAccessWithItems(items);
    },
  };

  return accessChecker;
}

export async function checkAuthorization(params: ICheckAuthorizationParams) {
  const {targets} = params;
  const pItemsList = await fetchAndSortAgentPermissionItems(params);
  const accessChecker = newAccessChecker(params, pItemsList);
  targets.forEach(target => {
    if (target.targetId) {
      accessChecker.checkForTargetId(target.targetId);
    } else if (target.type) {
      accessChecker.checkForTargetType(target.type);
    }
  });
}

export async function fetchAgentPermissionItems(
  params: ICheckAuthorizationParams & {fetchEntitiesDeep: boolean}
) {
  const {context, agent, workspaceId, action, targets} = params;
  if (agent.user && !agent.user.isEmailVerified && action !== BasicCRUDActions.Read) {
    // Only read actions are permitted for user's who aren't email verified.
    throw new EmailAddressNotVerifiedError();
  }

  appAssert(targets.length === 0, new ServerError(), 'Provide atleast one target.');
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
    actionList = toArray(action).concat(BasicCRUDActions.All),
    containerId = workspaceId;
  const pItemsList = await context.semantic.permissions.getPermissionItemsForEntities({
    context,
    entities: entityIdList,
    sortByContainer: true,
    sortByDate: true,
    andQueries: targets.map(target => {
      appAssert(
        target.targetId || target.type,
        new ServerError(),
        `Target should have a target ID or type.\n${format(target)}`
      );
      return {
        action: actionList,
        containerId: target.containerId ?? containerId,
        targetType: target.type
          ? toArray(target.type).concat(AppResourceType.All)
          : target.targetId
          ? [getResourceTypeFromId(target.targetId), AppResourceType.All]
          : stopControlFlow(),
        targetIdIfPresent: target.targetId,
        // appliesTo: target.targetId
        //   ? undefined
        //   : [PermissionItemAppliesTo.ContainerAndChildren, PermissionItemAppliesTo.Children],
      };
    }),
  });

  return pItemsList;
}

export async function fetchAndSortAgentPermissionItems(params: ICheckAuthorizationParams) {
  const {targets} = params;
  const pItemsList = await fetchAgentPermissionItems({...params, fetchEntitiesDeep: true});
  pItemsList.forEach((pItems, i) => {
    pItemsList[i] = sortOutPermissionItems(pItems, item => {
      return item.appliesTo === PermissionItemAppliesTo.Container
        ? item.containerId === targets[i].targetId
        : true;
    });
  });

  return pItemsList;
}

/**
 * Assumes permission items are for the same entity and container. If that
 * changes, change this function accordingly.
 */
export function uniquePermissionItems(items: IPermissionItem[]) {
  const map: Record<string, boolean> = {};

  const getItemAccessKeys = (item: IPermissionItem) => {
    const actions = item.action === BasicCRUDActions.All ? getWorkspaceActionList() : [item.action];
    const resourceTypes =
      item.targetType === AppResourceType.All ? getWorkspaceResourceTypeList() : [item.targetType];
    const keys: string[] = [];
    actions.forEach(action => {
      resourceTypes.forEach(type =>
        keys.push(makeKey([type, action, item.targetId, item.appliesTo, item.grantAccess]))
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
      map[key] = true;
    });
    return true;
  };

  items = items.filter(processItem);
  return items;
}

export function sortOutPermissionItems(
  items: IPermissionItem[],
  extraFn: (item: IPermissionItem) => boolean = () => true
) {
  const itemsAllowingAccess: Record<string, boolean> = {},
    itemsDenyingAccess: Record<string, boolean> = {};

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
        itemsAllowingAccess[key] = true;
      });
    } else {
      itemKeys.forEach(key => {
        itemsDenyingAccess[key] = true;
      });
    }

    return true;
  };

  items = items.filter(item => {
    return processItem(item) || extraFn(item);
  });
  return items;
}

export async function summarizeAgentPermissionItems(params: ICheckAuthorizationParams) {
  const pItemsList = await fetchAndSortAgentPermissionItems(params);
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

  for (const items of pItemsList) {
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
