import {defaultTo, mapKeys} from 'lodash';
import {
  AppResourceType,
  BasicCRUDActions,
  IResourceBase,
  ISessionAgent,
} from '../../definitions/system';
import {makeKey} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {
  IPromiseWithId,
  ISettledPromiseWithId,
  waitOnPromisesWithId,
} from '../../utils/waitOnPromises';
import {
  checkAuthorization,
  getResourcePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {IFetchResourceItem, IResource} from './types';

export type IFetchResourceItemWithAction = IFetchResourceItem & {
  action?: BasicCRUDActions;
};

export interface IGetResourcesOptions {
  context: IBaseContext;
  inputResources: Array<IFetchResourceItemWithAction>;
  allowedTypes?: AppResourceType[];
  throwOnFetchError?: boolean;
  checkAuth?: boolean;
  agent?: ISessionAgent | null;
  workspaceId?: string | null;
  action?: BasicCRUDActions | null;
  nothrowOnCheckError?: boolean;
}

export async function getResources(options: IGetResourcesOptions) {
  const {
    context,
    inputResources,
    agent,
    workspaceId,
    nothrowOnCheckError,
    allowedTypes = [AppResourceType.All],
    action = BasicCRUDActions.Read,
    throwOnFetchError = true,
    checkAuth = true,
  } = options;

  const idsGroupedByType: Record<string, string[]> = {};
  const allowedTypesMap = indexArray(allowedTypes);
  const checkedInputResourcesMap = inputResources.reduce((map, item) => {
    const resourceType = getResourceTypeFromId(item.resourceId);
    if (allowedTypesMap[AppResourceType.All] ?? allowedTypesMap[resourceType]) {
      const ids = defaultTo(idsGroupedByType[resourceType], []);
      ids.push(item.resourceId);
      idsGroupedByType[resourceType] = ids;
      map[makeKey([item.resourceId, resourceType])] = item;
    }

    return map;
  }, {} as Record<string, IFetchResourceItemWithAction>);

  const checkedInputResources = Object.values(checkedInputResourcesMap);

  interface IExtendedPromiseWithId<T> extends IPromiseWithId<T> {
    resourceType: AppResourceType;
  }

  interface IExtendedSettledPromiseWithId<T> extends ISettledPromiseWithId<T> {
    resourceType: AppResourceType;
  }

  const promises: Array<IExtendedPromiseWithId<IResourceBase[]>> = [];
  mapKeys(idsGroupedByType, (ids, type) => {
    switch (type) {
      case AppResourceType.Workspace:
        promises.push({
          id: AppResourceType.Workspace,
          promise: context.semantic.workspace.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.CollaborationRequest:
        promises.push({
          id: AppResourceType.CollaborationRequest,
          promise: context.semantic.collaborationRequest.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.AgentToken:
        promises.push({
          id: AppResourceType.AgentToken,
          promise: context.semantic.agentToken.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.PermissionGroup:
        promises.push({
          id: AppResourceType.PermissionGroup,
          promise: context.semantic.permissionGroup.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.PermissionItem:
        promises.push({
          id: AppResourceType.PermissionItem,
          promise: context.semantic.permissionItem.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.Folder:
        promises.push({
          id: AppResourceType.Folder,
          promise: context.semantic.folder.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.File:
        promises.push({
          id: AppResourceType.File,
          promise: context.semantic.file.getManyByIdList(ids),
          resourceType: type,
        });
        break;

      case AppResourceType.User:
        promises.push({
          id: AppResourceType.User,
          promise: context.semantic.user.getManyByIdList(ids),
          resourceType: type,
        });
        break;
    }
  });

  const settledPromises = (await waitOnPromisesWithId(promises)) as Array<
    IExtendedSettledPromiseWithId<IResourceBase[]>
  >;

  const resources: Array<IResource> = [];
  if (!checkAuth || !agent || !workspaceId) {
    settledPromises.forEach(item => {
      if (item.resolved) {
        item.value?.forEach(resource => {
          resources.push({
            resource,
            resourceId: resource.resourceId,
            resourceType: getResourceTypeFromId(resource.resourceId),
          });
        });
      } else if (throwOnFetchError) {
        throw item.reason;
      }
    });
  } else {
    const authCheckPromises: IExtendedPromiseWithId<boolean>[] = [];
    const resourceIndexer = (resourceId: string, resourceType: AppResourceType) =>
      `${resourceId}-${resourceType}`;
    const inputMap = indexArray(checkedInputResources, {
      indexer: item => resourceIndexer(item.resourceId, getResourceTypeFromId(item.resourceId)),
    });

    settledPromises.forEach(item => {
      if (item.resolved) {
        // TODO: can we do this together, so that we don't waste compute
        item.value?.forEach(resource => {
          const resourceType = getResourceTypeFromId(resource.resourceId);
          const key = resourceIndexer(resource.resourceId, resourceType);
          const resourceAction = inputMap[key]?.action ?? action ?? BasicCRUDActions.Read;

          // TODO: when server caching and resolving permission containers is
          // complete, make just one call to checkAuthorization to check access
          const checkPromise = checkAuthorization({
            context,
            agent,
            workspaceId,
            targets: {targetId: resource.resourceId},
            containerId: getResourcePermissionContainers(workspaceId, resource),
            action: resourceAction,
            nothrow: nothrowOnCheckError,
          });

          authCheckPromises.push({
            id: resource.resourceId,
            promise: checkPromise,
            resourceType: resourceType,
          });
        });
      } else if (throwOnFetchError) {
        throw item.reason;
      }
    });

    const settledAuthCheckPromises = (await waitOnPromisesWithId(
      authCheckPromises
    )) as IExtendedSettledPromiseWithId<boolean>[];

    const settledAuthCheckMap: Record<string, boolean> = {};
    settledAuthCheckPromises.forEach(item => {
      if (item.resolved) {
        const key = resourceIndexer(item.id as string, resourceType);
        settledAuthCheckMap[key] = item.value ?? false;
      } else if (item.reason) {
        // Only set when nothrow is false and auth check fails
        throw item.reason;
      }
    });

    settledPromises.forEach(item => {
      if (item.resolved && item.value) {
        item.value.forEach(resource => {
          const key = resourceIndexer(resource.resourceId, resourceType);
          const permitted = settledAuthCheckMap[key];
          if (permitted) {
            resources.push({
              resource,
              resourceId: resource.resourceId,
              resourceType: resourceType,
            });
          }
        });
      }
    });
  }

  return resources;
}
