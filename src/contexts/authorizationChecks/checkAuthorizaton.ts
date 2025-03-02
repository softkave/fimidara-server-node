import {defaultTo, first, get, isString, set} from 'lodash-es';
import {OmitFrom} from 'softkave-js-utils';
import {ValueOf} from 'type-fest';
import {File} from '../../definitions/file.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
  kFimidaraPermissionActions,
} from '../../definitions/permissionItem.js';
import {
  Resource,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {UserWithWorkspace} from '../../definitions/user.js';
import {Workspace} from '../../definitions/workspace.js';
import {checkResourcesBelongsToWorkspace} from '../../endpoints/resources/containerCheckFns.js';
import {
  EmailAddressNotVerifiedError,
  PermissionDeniedError,
} from '../../endpoints/users/errors.js';
import {appAssert} from '../../utils/assertion.js';
import {ServerError} from '../../utils/errors.js';
import {convertToArray, toCompactArray, toUniqArray} from '../../utils/fns.js';
import {sortPermissionEntityInheritanceMap} from '../../utils/permissionEntityUtils.js';
import {getResourceTypeFromId} from '../../utils/resource.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {kIjxSemantic} from '../ijx/injectables.js';
import {SemanticProviderOpParams} from '../semantic/types.js';

export interface AccessCheckTarget {
  entityId: string;
  action: FimidaraPermissionAction | FimidaraPermissionAction[];
  /** single target, or target + containers, e.g file + parent folder IDs */
  targetId: string | string[];
}

export interface CheckAuthorizationParams {
  workspaceId: string;
  workspace?: Pick<Workspace, 'publicPermissionGroupId'>;
  target: AccessCheckTarget;
  opts?: SemanticProviderOpParams;
  nothrow?: boolean;
}

export type ResolvedPermissionCheck =
  | {
      hasAccess: true;
      item: PermissionItem;
    }
  | {
      hasAccess: false;
      item?: PermissionItem;
    };

type AccessCheckGroupedPermissions = Record<
  /** entityId */ string,
  Record<
    /** targetId */ string,
    Partial<Record</** action */ FimidaraPermissionAction, PermissionItem[]>>
  >
>;

export interface ResolvedPermissionsAccessCheckerType {
  checkForTargetId: (
    entityId: string,
    targetId: string,
    action: FimidaraPermissionAction,
    nothrow?: boolean
  ) => ResolvedPermissionCheck;
  checkAuthParams: (nothrow?: boolean) => ResolvedPermissionCheck[];
}

export const kResolvedTargetChildrenAccess = {
  full: 'full',
  deny: 'deny',
  partial: 'partial',
} as const;

export type ResolvedTargetChildrenAccess = ValueOf<
  typeof kResolvedTargetChildrenAccess
>;

export type ResolvedTargetChildrenAccessCheck =
  | {
      access: typeof kResolvedTargetChildrenAccess.full;
      item: PermissionItem;
      partialDenyItems: PermissionItem[];
      partialDenyIds: string[];
    }
  | {
      access: typeof kResolvedTargetChildrenAccess.deny;
      item: PermissionItem;
    }
  | {
      access: typeof kResolvedTargetChildrenAccess.partial;
      item?: PermissionItem;
      partialAllowItems: PermissionItem[];
      partialAllowIds: string[];
    };

class ResolvedPermissionsAccessChecker
  implements ResolvedPermissionsAccessCheckerType
{
  constructor(
    protected permissions: AccessCheckGroupedPermissions,
    protected authParams: CheckAuthorizationParams
  ) {}

  checkForTargetId(
    entityId: string,
    targetId: string,
    action: FimidaraPermissionAction,
    nothrow?: boolean
  ) {
    const key = `${entityId}.${targetId}.${action}`;
    const wildcardKey = `${entityId}.${targetId}.${kFimidaraPermissionActions.wildcard}`;
    const items = get(
      this.permissions,
      key,
      get(this.permissions, wildcardKey, [])
    ) as PermissionItem[];
    return this.checkAccess(items, nothrow);
  }

  checkAuthParams(nothrow = this.authParams.nothrow) {
    const {target} = this.authParams;
    const targetId = first(convertToArray(target.targetId));

    if (targetId) {
      return convertToArray(this.authParams.target.action).map(nextAction =>
        this.checkForTargetId(target.entityId, targetId, nextAction, nothrow)
      );
    } else {
      throw new ServerError('Target ID not present');
    }
  }

  protected checkAccess = (
    items: PermissionItem[],
    nothrow = false
  ): ResolvedPermissionCheck => {
    const item = first(items);

    if (item?.access) {
      return {item, hasAccess: true};
    } else if (nothrow) {
      return {item, hasAccess: false};
    } else {
      throw new PermissionDeniedError({item});
    }
  };
}

export async function getAuthorizationAccessChecker(
  params: CheckAuthorizationParams
) {
  const {itemsMap} = await fetchAndSortAgentPermissionItems(params);
  return new ResolvedPermissionsAccessChecker(itemsMap, params);
}

export async function checkAuthorization(params: CheckAuthorizationParams) {
  const checker = await getAuthorizationAccessChecker(params);
  return checker.checkAuthParams();
}

export async function resolveEntityData(
  params: CheckAuthorizationParams & {fetchEntitiesDeep: boolean}
) {
  const {target} = params;

  const workspaceModel = kIjxSemantic.workspace();
  const permissionsModel = kIjxSemantic.permissions();

  const workspace =
    params.workspace ??
    (await workspaceModel.getOneById(params.workspaceId, params.opts));
  appAssert(workspace, kReuseableErrors.workspace.notFound());

  const [entityInheritanceMap, publicInheritanceMap] = await Promise.all([
    permissionsModel.getEntityInheritanceMap(
      {
        entityId: target.entityId,
        fetchDeep: params.fetchEntitiesDeep,
        workspaceId: params.workspaceId,
      },
      params.opts
    ),
    permissionsModel.getEntityInheritanceMap(
      {
        entityId: workspace.publicPermissionGroupId,
        fetchDeep: params.fetchEntitiesDeep,
        workspaceId: params.workspaceId,
      },
      params.opts
    ),
  ]);

  const {sortedItemsList: entitySortedItemList} =
    sortPermissionEntityInheritanceMap({
      map: entityInheritanceMap,
      entityId: target.entityId,
    });
  const {sortedItemsList: publicSortedItemList} =
    sortPermissionEntityInheritanceMap({
      map: publicInheritanceMap,
      entityId: workspace.publicPermissionGroupId,
    });

  const sortedItemsList = entitySortedItemList.concat(publicSortedItemList);
  const entityIdList = sortedItemsList.map(item => item.id);

  return {entityIdList};
}

export async function fetchAgentPermissionItems(
  params: CheckAuthorizationParams & {fetchEntitiesDeep: boolean}
) {
  const {workspaceId, target} = params;
  const action = convertToArray(target.action).concat(
      kFimidaraPermissionActions.wildcard
    ),
    targetId = toUniqArray(target.targetId, workspaceId);
  const {entityIdList} = await resolveEntityData(params);

  return await kIjxSemantic.permissions().getPermissionItems(
    {
      action,
      targetId,
      entityId: entityIdList,
      sortByTarget: true,
      sortByDate: true,
      sortByEntity: true,
    },
    params.opts
  );
}

export async function fetchAndSortAgentPermissionItems(
  params: CheckAuthorizationParams
) {
  const items = await fetchAgentPermissionItems({
    ...params,
    fetchEntitiesDeep: true,
  });
  const targetId = first(convertToArray(params.target.targetId));
  return sortOutPermissionItems(items, params.target.entityId, targetId);
}

function sortOutPermissionItems(
  items: PermissionItem[],
  replaceEntityId?: string,
  replaceTargetId?: string
) {
  const map: AccessCheckGroupedPermissions = {};

  items.forEach(item => {
    const key = [
      replaceEntityId ?? item.entityId,
      replaceTargetId ?? item.targetId,
      item.action,
    ];
    const entries = get(map, key) ?? [];
    entries.push(item);
    set(map, key, entries);
  });

  return {items, itemsMap: map};
}

async function resolveTargetChildrenPartialAccessCheck(
  params: OmitFrom<CheckAuthorizationParams, 'nothrow'>
) {
  const {workspaceId, target} = params;
  const action = convertToArray(target.action).concat(
      kFimidaraPermissionActions.wildcard
    ),
    targetParentId = defaultTo(
      first(toCompactArray(target.targetId)),
      workspaceId
    );

  // TODO: preferrably fetch once cause it's currently fetched twice, in
  // checkAuthorization and in here
  const {entityIdList} = await resolveEntityData({
    ...params,
    fetchEntitiesDeep: true,
  });
  const items = await kIjxSemantic.permissions().getPermissionItems(
    {
      action,
      targetParentId,
      entityId: entityIdList,
      sortByDate: true,
      sortByEntity: true,
    },
    params.opts
  );

  const partialAllowItems: PermissionItem[] = [];
  const partialAllowIds: string[] = [];
  const partialDenyItems: PermissionItem[] = [];
  const partialDenyIds: string[] = [];

  items.forEach(item => {
    if (item.access) {
      partialAllowIds.push(item.targetId);
      partialAllowItems.push(item);
    } else {
      partialDenyIds.push(item.targetId);
      partialDenyItems.push(item);
    }
  });

  return {
    partialAllowIds,
    partialAllowItems,
    partialDenyIds,
    partialDenyItems,
  };
}

export async function resolveTargetChildrenAccessCheck(
  params: OmitFrom<CheckAuthorizationParams, 'nothrow'>
): Promise<ResolvedTargetChildrenAccessCheck> {
  const {target} = params;

  // Only support single action reads
  appAssert(isString(target.action));

  const [
    parentCheckList,
    {partialAllowIds, partialAllowItems, partialDenyIds, partialDenyItems},
  ] = await Promise.all([
    checkAuthorization({...params, nothrow: true}),
    resolveTargetChildrenPartialAccessCheck(params),
  ]);

  const parentCheck = first(parentCheckList);

  // Only supporting single action reads
  appAssert(parentCheck && parentCheckList.length === 1);

  if (parentCheck.hasAccess) {
    return {
      partialDenyIds,
      partialDenyItems,
      access: kResolvedTargetChildrenAccess.full,
      item: parentCheck.item,
    };
  } else if (
    !parentCheck.hasAccess &&
    parentCheck.item &&
    partialAllowIds.length === 0
  ) {
    return {access: kResolvedTargetChildrenAccess.deny, item: parentCheck.item};
  } else {
    return {
      partialAllowIds,
      partialAllowItems,
      access: kResolvedTargetChildrenAccess.partial,
    };
  }
}

export function getWorkspacePermissionContainers(
  workspaceId: string
): string[] {
  return [workspaceId];
}

export function getFilePermissionContainers(
  workspaceId: string,
  resource: {idPath: string[]},
  includeResourceId: boolean
) {
  return resource.idPath
    .slice(0, includeResourceId ? undefined : -1)
    .reverse()
    .concat(getWorkspacePermissionContainers(workspaceId));
}

export function getResourcePermissionContainers(
  workspaceId: string,
  resource: Resource | (Resource & Pick<File, 'idPath'>) | null | undefined,
  includeResourceId: boolean
) {
  if (resource && (resource as Pick<File, 'idPath'>).idPath) {
    return getFilePermissionContainers(
      workspaceId,
      resource as Pick<File, 'idPath'>,
      includeResourceId
    );
  } else if (
    resource &&
    getResourceTypeFromId(resource.resourceId) === kFimidaraResourceType.User
  ) {
    const user = resource as unknown as UserWithWorkspace;
    checkResourcesBelongsToWorkspace(workspaceId, [
      {
        resourceId: user.resourceId,
        resourceType: kFimidaraResourceType.User,
        resource: user,
      },
    ]);
  }

  return getWorkspacePermissionContainers(workspaceId);
}

function checkActionRequiresUserVerification(
  agent: SessionAgent,
  action: FimidaraPermissionAction | FimidaraPermissionAction[]
) {
  if (
    agent &&
    agent.user &&
    !agent.user.isEmailVerified &&
    !convertToArray(action).every(nextAction => nextAction.startsWith('read'))
  ) {
    // Only read actions are permitted for user's who aren't email verified.
    throw new EmailAddressNotVerifiedError();
  }
}

export async function checkAuthorizationWithAgent(
  params: Omit<CheckAuthorizationParams, 'target'> & {
    agent: SessionAgent;
    target: Omit<CheckAuthorizationParams['target'], 'entityId'> & {
      entityId?: string;
    };
  }
) {
  const {agent, target} = params;
  checkActionRequiresUserVerification(agent, target.action);

  const agentId = agent?.agentId;
  appAssert(agentId);
  return await checkAuthorization({
    ...params,
    target: {...target, entityId: agentId},
  });
}

export async function resolveTargetChildrenAccessCheckWithAgent(
  params: OmitFrom<CheckAuthorizationParams, 'target' | 'nothrow'> & {
    agent: SessionAgent;
    target: Omit<CheckAuthorizationParams['target'], 'entityId'> & {
      entityId?: string;
    };
  }
) {
  const {agent, target} = params;
  checkActionRequiresUserVerification(agent, target.action);

  const agentId = agent?.agentId;
  appAssert(agentId);
  return await resolveTargetChildrenAccessCheck({
    ...params,
    target: {...target, entityId: agentId},
  });
}
