import {compact, forEach, get, map, mapKeys} from 'lodash';
import {File} from '../../definitions/file';
import {
  AppActionType,
  AppResourceType,
  Resource,
  ResourceWrapper,
  SessionAgent,
} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {isObjectEmpty, makeKey, toArray} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {getResourceTypeFromId} from '../../utils/resource';
import {PartialRecord} from '../../utils/types';
import {IPromiseWithId, waitOnPromisesWithId} from '../../utils/waitOnPromises';
import {
  IAuthAccessCheckers,
  getAuthorizationAccessChecker,
  getResourcePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {folderConstants} from '../folders/constants';
import {checkResourcesBelongsToWorkspace} from './containerCheckFns';
import {resourceListWithAssignedItems} from './resourceWithAssignedItems';
import {FetchResourceItem} from './types';

export type FetchResourceItemWithAction = FetchResourceItem & {
  action?: AppActionType;
};

interface IExtendedPromiseWithId<T> extends IPromiseWithId<T> {
  resourceType: AppResourceType;
}

type InputsWithIdGroupedByType = PartialRecord<
  AppResourceType,
  Record</** resource ID */ string, AppActionType | undefined>
>;

type FilePathsMap = PartialRecord</** filepath or folderpath */ string, AppActionType | undefined>;

export interface GetResourcesOptions {
  context: BaseContextType;
  inputResources: Array<FetchResourceItemWithAction>;
  allowedTypes: AppResourceType[];
  checkAuth?: boolean;
  agent: SessionAgent;
  workspaceId: string;
  action: AppActionType;
  nothrowOnCheckError?: boolean;
  dataFetchRunOptions?: SemanticDataAccessProviderRunOptions;

  /** User workspaces are automatically filled-in if `checkAuth` is true. */
  fillAssignedItems?: boolean;

  /** Will fill-in user workspaces if is `true` even if `fillAssignedItems` is
   * false. */
  checkBelongsToWorkspace?: boolean;
}

export async function INTERNAL_getResources(options: GetResourcesOptions) {
  const {
    context,
    inputResources,
    agent,
    workspaceId,
    nothrowOnCheckError,
    action,
    allowedTypes,
    dataFetchRunOptions,
    fillAssignedItems,
    checkBelongsToWorkspace,
    checkAuth = true,
  } = options;

  const {filepathsMap, folderpathsMap, inputsWithIdByType, workspaceRootname} = groupItemsToFetch(
    inputResources,
    allowedTypes
  );

  let [resources, files, folders, workspaceResource] = await Promise.all([
    fetchResourcesById(context, inputsWithIdByType, dataFetchRunOptions),
    fetchFiles(context, workspaceId, filepathsMap),
    fetchFolders(context, workspaceId, folderpathsMap),
    fetchWorkspace(context, workspaceRootname),
  ]);

  resources = resources.concat(files, folders, workspaceResource);

  if (fillAssignedItems)
    resources = await resourceListWithAssignedItems(context, workspaceId, resources);

  if (checkBelongsToWorkspace) {
    if (!fillAssignedItems)
      resources = await resourceListWithAssignedItems(context, workspaceId, resources, [
        AppResourceType.User,
      ]);
    checkResourcesBelongsToWorkspace(workspaceId, resources);
  }

  if (checkAuth) {
    resources = await authCheckResources(
      context,
      agent,
      workspaceId,
      resources,
      inputsWithIdByType,
      filepathsMap,
      folderpathsMap,
      action,
      nothrowOnCheckError
    );
  }

  return resources;
}

function groupItemsToFetch(
  inputResources: Array<FetchResourceItemWithAction>,
  allowedTypes: AppResourceType[]
) {
  const inputsWithIdByType: InputsWithIdGroupedByType = {};
  const filepathsMap: FilePathsMap = {};
  const folderpathsMap: FilePathsMap = {};
  const allowedTypesMap = indexArray(allowedTypes);
  let workspaceRootname: string | undefined = undefined;

  inputResources.forEach(item => {
    if (item.resourceId) {
      const idList = toArray(item.resourceId);
      idList.forEach(resourceId => {
        const type = getResourceTypeFromId(resourceId);

        if (allowedTypesMap[AppResourceType.All] || allowedTypesMap[type]) {
          let inputByIdMap = inputsWithIdByType[type];
          if (!inputByIdMap) inputsWithIdByType[type] = inputByIdMap = {};

          inputByIdMap[resourceId] = item.action;
        }
      });
    } else if (item.filepath) {
      toArray(item.filepath).forEach(filepath => {
        filepathsMap[filepath] = item.action;
      });
    } else if (item.folderpath) {
      toArray(item.folderpath).forEach(folderpath => {
        folderpathsMap[folderpath] = item.action;
      });
    } else if (item.workspaceRootname) {
      workspaceRootname = item.workspaceRootname;
    }
  });

  return {
    inputsWithIdByType,
    allowedTypesMap,
    filepathsMap,
    folderpathsMap,
    workspaceRootname,
  };
}

function groupByContainerId(
  workspaceId: string,
  resources: Array<ResourceWrapper>,
  inputsWithIdByType: InputsWithIdGroupedByType,
  filepathsMap: FilePathsMap,
  folderpathsMap: FilePathsMap,
  action?: AppActionType
) {
  const map: Record<
    /** container ID or key */ string,
    Record</** action */ string, ResourceWrapper[]>
  > = {};
  const CONTAINERS_SEPARATOR = ';';

  const getContainerKey = (resource: ResourceWrapper) => {
    let filepath: string | undefined = undefined;
    const containerIds = getResourcePermissionContainers(workspaceId, resource.resource);
    const containerKey = makeKey(containerIds, CONTAINERS_SEPARATOR);

    if (
      resource.resourceType === AppResourceType.Folder ||
      resource.resourceType === AppResourceType.File
    ) {
      filepath = (resource.resource as unknown as Pick<File, 'namePath'>).namePath.join(
        folderConstants.nameSeparator
      );
    }

    return {containerKey, filepath};
  };

  const getContainersFromKey = (key: string) => key.split(CONTAINERS_SEPARATOR);

  resources.forEach(resource => {
    const {containerKey, filepath} = getContainerKey(resource);

    let actionsMap = map[containerKey];
    if (!actionsMap) map[containerKey] = actionsMap = {};

    let resourceAction = get(inputsWithIdByType[resource.resourceType] ?? {}, resource.resourceId);
    if (!resourceAction && resource.resourceType === AppResourceType.File && filepath)
      resourceAction = filepathsMap[filepath];
    if (!resourceAction && resource.resourceType === AppResourceType.Folder && filepath)
      resourceAction = folderpathsMap[filepath];
    if (!resourceAction) resourceAction = action ?? AppActionType.Read;

    let resourceList = actionsMap[resourceAction];
    if (!resourceList) actionsMap[resourceAction] = resourceList = [];
    resourceList.push(resource);
  });

  return {
    map,
    getContainerKey,
    getContainersFromKey,
    JOINED_CONTAINERS_SEPARATOR: CONTAINERS_SEPARATOR,
  };
}

async function fetchResourcesById(
  context: BaseContextType,
  idsGroupedByType: InputsWithIdGroupedByType,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (isObjectEmpty(idsGroupedByType)) return [];

  const promises: Array<IExtendedPromiseWithId<Resource[]>> = [];
  mapKeys(idsGroupedByType, (typeMap, type) => {
    appAssert(typeMap);
    switch (type) {
      case AppResourceType.Workspace: {
        promises.push({
          id: AppResourceType.Workspace,
          promise: context.semantic.workspace.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.CollaborationRequest: {
        promises.push({
          id: AppResourceType.CollaborationRequest,
          promise: context.semantic.collaborationRequest.getManyByIdList(
            Object.keys(typeMap),
            opts
          ),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.AgentToken: {
        promises.push({
          id: AppResourceType.AgentToken,
          promise: context.semantic.agentToken.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.PermissionGroup: {
        promises.push({
          id: AppResourceType.PermissionGroup,
          promise: context.semantic.permissionGroup.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.PermissionItem: {
        promises.push({
          id: AppResourceType.PermissionItem,
          promise: context.semantic.permissionItem.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.Folder: {
        promises.push({
          id: AppResourceType.Folder,
          promise: context.semantic.folder.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.File: {
        promises.push({
          id: AppResourceType.File,
          promise: context.semantic.file.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceType.User: {
        promises.push({
          id: AppResourceType.User,
          promise: context.semantic.user.getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      default:
        appAssert(false, new ServerError(), `Unsupported resource type ${type}`);
    }
  });

  const resources: Array<ResourceWrapper> = [];
  const settledPromises = await waitOnPromisesWithId(promises);

  settledPromises.forEach(item => {
    if (item.resolved) {
      item.value?.forEach(resource => {
        resources.push({
          resource,
          resourceId: resource.resourceId,
          resourceType: getResourceTypeFromId(resource.resourceId),
        });
      });
    } else {
      throw item.reason ?? new ServerError();
    }
  });

  return resources;
}

const fetchFiles = async (
  context: BaseContextType,
  workspaceId: string,
  filepathsMap: FilePathsMap
) => {
  if (isObjectEmpty(filepathsMap)) return [];

  const result = await Promise.all(
    // TODO: can we have $or or implement $in for array of arrays?
    map(filepathsMap, (action, filepath) =>
      context.semantic.file.getOneByNamePath(
        workspaceId,
        filepath.split(folderConstants.nameSeparator)
      )
    )
  );

  return compact(result).map(
    (item): ResourceWrapper => ({
      resourceId: item.resourceId,
      resourceType: AppResourceType.File,
      resource: item,
    })
  );
};

const fetchFolders = async (
  context: BaseContextType,
  workspaceId: string,
  folderpathsMap: FilePathsMap
) => {
  if (isObjectEmpty(folderpathsMap)) return [];

  const result = await Promise.all(
    // TODO: can we have $or or implement $in for array of arrays?
    map(folderpathsMap, (action, folderpath) =>
      context.semantic.folder.getOneByNamePath(
        workspaceId,
        folderpath.split(folderConstants.nameSeparator)
      )
    )
  );

  return compact(result).map(
    (item): ResourceWrapper => ({
      resourceId: item.resourceId,
      resourceType: AppResourceType.Folder,
      resource: item,
    })
  );
};

const fetchWorkspace = async (context: BaseContextType, workspaceRootname?: string) => {
  if (!workspaceRootname) return [];

  const result = await context.semantic.workspace.getByRootname(workspaceRootname);
  const resources: ResourceWrapper[] = result
    ? [
        {
          resourceId: result.resourceId,
          resourceType: AppResourceType.Workspace,
          resource: result,
        },
      ]
    : [];
  return resources;
};

async function authCheckResources(
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string,
  resources: Array<ResourceWrapper>,
  inputsWithIdByType: InputsWithIdGroupedByType,
  filepathsMap: FilePathsMap,
  folderpathsMap: FilePathsMap,
  action?: AppActionType,
  nothrowOnCheckError?: boolean
) {
  const authCheckPromises: IPromiseWithId<IAuthAccessCheckers>[] = [];
  const {getContainersFromKey, map: groupedByContainer} = groupByContainerId(
    workspaceId,
    resources,
    inputsWithIdByType,
    filepathsMap,
    folderpathsMap,
    action
  );

  forEach(groupedByContainer, (actionsMap, containerKey) => {
    forEach(actionsMap, (resourceList, nextAction) => {
      const containerIds = getContainersFromKey(containerKey);
      const accessChecker = getAuthorizationAccessChecker({
        context,
        agent,
        workspaceId,
        containerId: containerIds,
        action: nextAction as AppActionType,
        targets: resourceList.map(nextResource => ({targetId: nextResource.resourceId})),
      });

      const key = makeKey([containerKey, nextAction]);
      authCheckPromises.push({id: key, promise: accessChecker});
    });
  });

  const resolvedAuthCheckPromises = await waitOnPromisesWithId(authCheckPromises);
  const resolvedAuthCheckMap: PartialRecord<string, IAuthAccessCheckers> = {};
  resolvedAuthCheckPromises.forEach(next => {
    if (next.resolved) {
      resolvedAuthCheckMap[next.id] = next.value;
    } else if (!nothrowOnCheckError) {
      throw next.reason ?? new ServerError();
    }
  });

  let authCheckedResources: Array<ResourceWrapper> = [];

  forEach(groupedByContainer, (actionsMap, containerKey) => {
    forEach(actionsMap, (resourceList, nextAction) => {
      const key = makeKey([containerKey, nextAction]);
      const accessChecker = resolvedAuthCheckMap[key];
      if (!accessChecker) return;

      const containerIds = getContainersFromKey(containerKey);
      resourceList.forEach(resource =>
        accessChecker.checkForTargetId(
          resource.resourceId,
          nextAction as AppActionType,
          containerIds
        )
      );

      authCheckedResources = authCheckedResources.concat(resourceList);
    });
  });

  return authCheckedResources;
}
