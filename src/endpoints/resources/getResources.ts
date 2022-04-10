import {defaultTo, mapKeys} from 'lodash';
import {IOrganization} from '../../definitions/organization';
import {
  AppResourceType,
  BasicCRUDActions,
  IResourceBase,
  ISessionAgent,
} from '../../definitions/system';
import {makeKey} from '../../utilities/fns';
import {indexArray} from '../../utilities/indexArray';
import {
  IPromiseWithId,
  ISettledPromiseWithId,
  waitOnPromisesWithId,
} from '../../utilities/waitOnPromises';
import {
  checkAuthorization,
  makeResourcePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import EndpointReusableQueries from '../queries';
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
  organization?: IOrganization | null;
  action?: BasicCRUDActions | null;
  nothrowOnCheckError?: boolean;
}

export async function getResources(options: IGetResourcesOptions) {
  const {
    context,
    inputResources,
    agent,
    organization,
    nothrowOnCheckError,
    allowedTypes = [AppResourceType.All],
    action = BasicCRUDActions.Read,
    throwOnFetchError = true,
    checkAuth = true,
  } = options;

  const idsGroupedByType: Record<string, string[]> = {};
  const allowedTypesMap = indexArray(allowedTypes);
  const checkedInputResourcesMap = inputResources.reduce((map, item) => {
    if (
      allowedTypesMap[AppResourceType.All] ||
      allowedTypesMap[item.resourceType]
    ) {
      const ids = defaultTo(idsGroupedByType[item.resourceType], []);
      ids.push(item.resourceId);
      idsGroupedByType[item.resourceType] = ids;
      map[makeKey([item.resourceId, item.resourceType])] = item;
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
    const query = EndpointReusableQueries.getByIds(ids);
    switch (type) {
      case AppResourceType.Organization:
        promises.push({
          id: AppResourceType.Organization,
          promise: context.data.organization.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.CollaborationRequest:
        promises.push({
          id: AppResourceType.CollaborationRequest,
          promise: context.data.collaborationRequest.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.ProgramAccessToken:
        promises.push({
          id: AppResourceType.ProgramAccessToken,
          promise: context.data.programAccessToken.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.ClientAssignedToken:
        promises.push({
          id: AppResourceType.ClientAssignedToken,
          promise: context.data.clientAssignedToken.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.UserToken:
        promises.push({
          id: AppResourceType.UserToken,
          promise: context.data.userToken.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.PresetPermissionsGroup:
        promises.push({
          id: AppResourceType.PresetPermissionsGroup,
          promise: context.data.preset.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.PermissionItem:
        promises.push({
          id: AppResourceType.PermissionItem,
          promise: context.data.permissionItem.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.Folder:
        promises.push({
          id: AppResourceType.Folder,
          promise: context.data.folder.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.File:
        promises.push({
          id: AppResourceType.File,
          promise: context.data.file.getManyItems(query),
          resourceType: type,
        });
        break;

      case AppResourceType.User:
        promises.push({
          id: AppResourceType.User,
          promise: context.data.user.getManyItems(query),
          resourceType: type,
        });
        break;
    }
  });

  const settledPromises = (await waitOnPromisesWithId(promises)) as Array<
    IExtendedSettledPromiseWithId<IResourceBase[]>
  >;

  const resources: Array<IResource> = [];

  if (!checkAuth || !agent || !organization) {
    settledPromises.forEach(item => {
      if (item.resolved) {
        item.value?.forEach(resource => {
          resources.push({
            resource,
            resourceId: resource.resourceId,
            resourceType: item.resourceType,
          });
        });
      } else if (throwOnFetchError) {
        throw item.reason;
      }
    });
  } else {
    const authCheckPromises: IExtendedPromiseWithId<boolean>[] = [];
    const resourceIndexer = (
      resourceId: string,
      resourceType: AppResourceType
    ) => `${resourceId}-${resourceType}`;

    const inputMap = indexArray(checkedInputResources, {
      indexer: item => resourceIndexer(item.resourceId, item.resourceType),
    });

    settledPromises.forEach(item => {
      if (item.resolved) {
        // TODO: can we do this together, so that we don't waste compute
        item.value?.forEach(resource => {
          const key = resourceIndexer(resource.resourceId, item.resourceType);
          const resourceAction =
            inputMap[key]?.action || action || BasicCRUDActions.Read;

          const checkPromise = checkAuthorization({
            context,
            agent,
            organization,
            resource: resource,
            type: item.resourceType,
            permissionOwners: makeResourcePermissionOwnerList(
              organization.resourceId,
              item.resourceType,
              resource
            ),
            action: resourceAction,
            nothrow: nothrowOnCheckError,
          });

          authCheckPromises.push({
            id: resource.resourceId,
            promise: checkPromise,
            resourceType: item.resourceType,
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
        const key = resourceIndexer(item.id as string, item.resourceType);
        settledAuthCheckMap[key] = item.value || false;
      } else if (item.reason) {
        // Only set when nothrow is false and auth check fails
        throw item.reason;
      }
    });

    settledPromises.forEach(item => {
      if (item.resolved && item.value) {
        // groupedResources[item.id] = item.value.filter(resource => {
        //   return settledAuthCheckMap[
        //     resourceIndexer(resource.resourceId, item.resourceType)
        //   ];
        // });

        item.value.forEach(resource => {
          const key = resourceIndexer(resource.resourceId, item.resourceType);
          const permitted = settledAuthCheckMap[key];

          if (permitted) {
            resources.push({
              resource,
              resourceId: resource.resourceId,
              resourceType: item.resourceType,
            });
          }
        });
      }
    });
  }

  return resources;
  // return groupedResources;
}
