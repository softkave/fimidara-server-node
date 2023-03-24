import {mapKeys} from 'lodash';
import {
  AppActionType,
  AppResourceType,
  IResource,
  IResourceWrapper,
  ISessionAgent,
} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {makeKey} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {appMessages} from '../../utils/messages';
import {getResourceTypeFromId} from '../../utils/resourceId';
import {PartialRecord} from '../../utils/types';
import {IPromiseWithId, waitOnPromisesWithId} from '../../utils/waitOnPromises';
import {
  getAuthorizationAccessChecker,
  getResourcePermissionContainers,
  IAuthAccessCheckers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {PermissionDeniedError} from '../user/errors';
import {IFetchResourceItem} from './types';

export type IFetchResourceItemWithAction = IFetchResourceItem & {
  action?: AppActionType;
};

export interface IGetResourcesOptions {
  context: IBaseContext;
  inputResources: Array<IFetchResourceItemWithAction>;
  allowedTypes: AppResourceType[];
  throwOnFetchError?: boolean;
  checkAuth?: boolean;
  agent: ISessionAgent;
  workspaceId: string;
  action: AppActionType;
  nothrowOnCheckError?: boolean;
  dataFetchRunOptions?: ISemanticDataAccessProviderRunOptions;
}

interface IExtendedPromiseWithId<T> extends IPromiseWithId<T> {
  resourceType: AppResourceType;
}

export async function INTERNAL_getResources(options: IGetResourcesOptions) {
  const {
    context,
    inputResources,
    agent,
    workspaceId,
    nothrowOnCheckError,
    action,
    allowedTypes,
    dataFetchRunOptions,
    throwOnFetchError = true,
    checkAuth = true,
  } = options;

  const mapByTypeToIdList: PartialRecord<string, string[]> = {};
  const allowedTypesMap = indexArray(allowedTypes);
  const checkedInputResourcesMap = inputResources.reduce((map, item) => {
    const type = getResourceTypeFromId(item.resourceId);
    if (allowedTypesMap[AppResourceType.All] || allowedTypesMap[type]) {
      let ids = mapByTypeToIdList[type];
      if (!ids) {
        mapByTypeToIdList[type] = ids = [];
      }

      ids.push(item.resourceId);
      map[makeKey([item.resourceId, type])] = item;
    }
    return map;
  }, {} as PartialRecord<string, IFetchResourceItemWithAction>);

  const settledPromises = await fetchResources(context, mapByTypeToIdList, dataFetchRunOptions);
  const resources: Array<IResourceWrapper> = [];

  if (!checkAuth) {
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
    const authCheckPromises: IExtendedPromiseWithId<IAuthAccessCheckers>[] = [];
    settledPromises.forEach(item => {
      if (item.resolved) {
        // TODO: can we do this together, so that we don't waste compute
        item.value?.forEach(resource => {
          const resourceType = getResourceTypeFromId(resource.resourceId);
          const key = resource.resourceId;
          const resourceAction =
            checkedInputResourcesMap[key]?.action ?? action ?? AppActionType.Read;

          // TODO: when server caching and resolving permission containers is
          // complete, make just one call to checkAuthorization to check access
          const accessChecker = getAuthorizationAccessChecker({
            context,
            agent,
            workspaceId,
            targets: {targetId: resource.resourceId},
            containerId: getResourcePermissionContainers(workspaceId, resource),
            action: resourceAction,
          });
          authCheckPromises.push({
            id: resource.resourceId,
            promise: accessChecker,
            resourceType: resourceType,
          });
        });
      } else if (throwOnFetchError) {
        throw item.reason;
      }
    });

    const settledAuthCheckPromises = await waitOnPromisesWithId(authCheckPromises);
    const settledAuthCheckMap = indexArray(settledAuthCheckPromises, {
      indexer: item => item.id as string,
      reducer: item => {
        if (item.resolved) {
          const input = checkedInputResourcesMap[item.id];
          const inputAction = input?.action ?? action;
          return item.value.checkForTargetId(inputAction, item.id as string, nothrowOnCheckError);
        } else {
          throw item.reason ?? new ServerError();
        }
      },
    });
    settledPromises.forEach(item => {
      if (item.resolved) {
        item.value.forEach(resource => {
          const permitted = settledAuthCheckMap[resource.resourceId];
          if (permitted) {
            resources.push({
              resource,
              resourceId: resource.resourceId,
              resourceType: getResourceTypeFromId(resource.resourceId),
            });
          } else if (!nothrowOnCheckError) {
            throw new PermissionDeniedError(appMessages.common.permissionDenied());
          }
        });
      }
    });
  }

  return resources;
}

async function fetchResources(
  context: IBaseContext,
  idsGroupedByType: PartialRecord<string, string[]>,
  opts?: ISemanticDataAccessProviderRunOptions
) {
  const promises: Array<IExtendedPromiseWithId<IResource[]>> = [];
  mapKeys(idsGroupedByType, (ids, type) => {
    appAssert(ids);
    switch (type) {
      case AppResourceType.Workspace: {
        promises.push({
          id: AppResourceType.Workspace,
          promise: context.semantic.workspace.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.CollaborationRequest: {
        promises.push({
          id: AppResourceType.CollaborationRequest,
          promise: context.semantic.collaborationRequest.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.AgentToken: {
        promises.push({
          id: AppResourceType.AgentToken,
          promise: context.semantic.agentToken.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.PermissionGroup: {
        promises.push({
          id: AppResourceType.PermissionGroup,
          promise: context.semantic.permissionGroup.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.PermissionItem: {
        promises.push({
          id: AppResourceType.PermissionItem,
          promise: context.semantic.permissionItem.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.Folder: {
        promises.push({
          id: AppResourceType.Folder,
          promise: context.semantic.folder.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.File: {
        promises.push({
          id: AppResourceType.File,
          promise: context.semantic.file.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.User: {
        promises.push({
          id: AppResourceType.User,
          promise: context.semantic.user.getManyByIdList(ids, opts),
          resourceType: type,
        });
        break;
      }
      default:
        appAssert(false, new ServerError(), `Unsupported resource type ${type}`);
    }
  });

  return await waitOnPromisesWithId(promises);
}
