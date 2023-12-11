import assert from 'assert';
import {compact, get, map, mapKeys} from 'lodash';
import {PermissionAction} from '../../definitions/permissionItem';
import {
  AppResourceType,
  AppResourceTypeMap,
  Resource,
  ResourceWrapper,
  SessionAgent,
} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {isObjectEmpty, toArray} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {getResourceTypeFromId} from '../../utils/resource';
import {PartialRecord} from '../../utils/types';
import {PromiseWithId, waitOnPromisesWithId} from '../../utils/waitOnPromises';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injectables';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {kFolderConstants} from '../folders/constants';
import {checkResourcesBelongsToWorkspace} from './containerCheckFns';
import {resourceListWithAssignedItems} from './resourceWithAssignedItems';
import {FetchResourceItem} from './types';

interface ExtendedPromiseWithId<T> extends PromiseWithId<T> {
  resourceType: AppResourceType;
}

type InputsWithIdGroupedByType = PartialRecord<
  AppResourceType,
  Record</** resource ID */ string, PermissionAction>
>;

type FilePathsMap = PartialRecord</** filepath or folderpath */ string, PermissionAction>;

interface WorkspaceRootnameWithAction {
  workspaceRootname: string;
  action: PermissionAction;
}

export interface GetResourcesOptions {
  inputResources: Array<FetchResourceItem>;
  allowedTypes: AppResourceType[];
  checkAuth?: boolean;
  agent: SessionAgent;
  workspaceId: string;
  nothrowOnCheckError?: boolean;
  dataFetchRunOptions?: SemanticProviderRunOptions;

  /** User workspaces are automatically filled-in if `checkAuth` is true. */
  fillAssignedItems?: boolean;

  /** Will fill-in user workspaces if is `true` even if `fillAssignedItems` is
   * false. */
  checkBelongsToWorkspace?: boolean;
}

type GetResourcesResourceWrapper = ResourceWrapper & {action: PermissionAction};

export async function INTERNAL_getResources(options: GetResourcesOptions) {
  const {
    inputResources,
    agent,
    workspaceId,
    nothrowOnCheckError,
    allowedTypes,
    dataFetchRunOptions,
    fillAssignedItems,
    checkBelongsToWorkspace,
    checkAuth = true,
  } = options;

  const {filepathsMap, folderpathsMap, inputsWithIdByType, workspaceRootname} =
    groupItemsToFetch(inputResources, allowedTypes);
  const fetchResults = await Promise.all([
    fetchResourcesById(inputsWithIdByType, dataFetchRunOptions),
    fetchFiles(workspaceId, filepathsMap),
    fetchFolders(workspaceId, folderpathsMap),
    fetchWorkspace(workspaceRootname),
  ]);

  const [resourcesById, files, folders, workspaceResource] = fetchResults;
  let assignedItemsFilled = false;
  let resources = resourcesById.concat(files, folders, workspaceResource);

  if (fillAssignedItems) {
    resources = await resourceListWithAssignedItems(workspaceId, resources);
    assignedItemsFilled = true;
  }

  if (checkBelongsToWorkspace) {
    if (!assignedItemsFilled) {
      resources = await resourceListWithAssignedItems(workspaceId, resources, [
        AppResourceTypeMap.User,
      ]);
      assignedItemsFilled = true;
    }

    checkResourcesBelongsToWorkspace(workspaceId, resources);
  }

  if (checkAuth) {
    if (!assignedItemsFilled) {
      resources = await resourceListWithAssignedItems(workspaceId, resources, [
        AppResourceTypeMap.User,
      ]);
      assignedItemsFilled = true;
    }

    resources = await authCheckResources(
      agent,
      workspaceId,
      resources,
      nothrowOnCheckError
    );
  }

  return resources;
}

function groupItemsToFetch(
  inputResources: Array<FetchResourceItem>,
  allowedTypes: AppResourceType[]
) {
  const inputsWithIdByType: InputsWithIdGroupedByType = {};
  const filepathsMap: FilePathsMap = {};
  const folderpathsMap: FilePathsMap = {};
  const allowedTypesMap = indexArray(allowedTypes);
  let workspaceRootname: WorkspaceRootnameWithAction | undefined = undefined;

  inputResources.forEach(item => {
    if (item.resourceId) {
      const idList = toArray(item.resourceId);
      idList.forEach(resourceId => {
        const type = getResourceTypeFromId(resourceId);

        if (allowedTypesMap[AppResourceTypeMap.All] || allowedTypesMap[type]) {
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
      workspaceRootname = {
        workspaceRootname: item.workspaceRootname,
        action: item.action,
      };
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

async function fetchResourcesById(
  idsGroupedByType: InputsWithIdGroupedByType,
  opts?: SemanticProviderRunOptions
) {
  if (isObjectEmpty(idsGroupedByType)) return [];

  const promises: Array<ExtendedPromiseWithId<Resource[]>> = [];
  mapKeys(idsGroupedByType, (typeMap, type) => {
    appAssert(typeMap);
    switch (type) {
      case AppResourceTypeMap.Workspace: {
        promises.push({
          id: AppResourceTypeMap.Workspace,
          promise: kSemanticModels
            .workspace()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.CollaborationRequest: {
        promises.push({
          id: AppResourceTypeMap.CollaborationRequest,
          promise: kSemanticModels
            .collaborationRequest()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.AgentToken: {
        promises.push({
          id: AppResourceTypeMap.AgentToken,
          promise: kSemanticModels
            .agentToken()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.PermissionGroup: {
        promises.push({
          id: AppResourceTypeMap.PermissionGroup,
          promise: kSemanticModels
            .permissionGroup()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.PermissionItem: {
        promises.push({
          id: AppResourceTypeMap.PermissionItem,
          promise: kSemanticModels
            .permissionItem()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.Folder: {
        promises.push({
          id: AppResourceTypeMap.Folder,
          promise: kSemanticModels.folder().getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.File: {
        promises.push({
          id: AppResourceTypeMap.File,
          promise: kSemanticModels.file().getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case AppResourceTypeMap.User: {
        promises.push({
          id: AppResourceTypeMap.User,
          promise: kSemanticModels.user().getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      default:
        appAssert(false, new ServerError(), `Unsupported resource type ${type}`);
    }
  });

  const resources: Array<GetResourcesResourceWrapper> = [];
  const settledPromises = await waitOnPromisesWithId(promises);

  settledPromises.forEach(item => {
    if (item.resolved) {
      item.value?.forEach(resource => {
        const action = get(idsGroupedByType, [item.resourceType, resource.resourceId]);
        resources.push({
          action,
          resource,
          resourceId: resource.resourceId,
          resourceType: item.resourceType,
        });
      });
    } else {
      throw item.reason ?? new ServerError();
    }
  });

  return resources;
}

const fetchFiles = async (workspaceId: string, filepathsMap: FilePathsMap) => {
  if (isObjectEmpty(filepathsMap)) return [];

  const result = await Promise.all(
    // TODO: can we have $or or implement $in for array of arrays?
    map(filepathsMap, (action, filepath) =>
      kSemanticModels
        .file()
        .getOneByNamepath(workspaceId, filepath.split(kFolderConstants.separator))
    )
  );

  return compact(result).map((item): GetResourcesResourceWrapper => {
    const action = filepathsMap[item.resourceId];
    assert(action);
    return {
      action,
      resourceId: item.resourceId,
      resourceType: AppResourceTypeMap.File,
      resource: item,
    };
  });
};

const fetchFolders = async (workspaceId: string, folderpathsMap: FilePathsMap) => {
  if (isObjectEmpty(folderpathsMap)) return [];

  const result = await Promise.all(
    // TODO: can we have $or or implement $in for array of arrays?
    map(folderpathsMap, (action, folderpath) =>
      kSemanticModels
        .folder()
        .getOneByNamepath(workspaceId, folderpath.split(kFolderConstants.separator))
    )
  );

  return compact(result).map((item): GetResourcesResourceWrapper => {
    const action = folderpathsMap[item.resourceId];
    assert(action);
    return {
      action,
      resourceId: item.resourceId,
      resourceType: AppResourceTypeMap.Folder,
      resource: item,
    };
  });
};

const fetchWorkspace = async (workspaceRootname?: WorkspaceRootnameWithAction) => {
  if (!workspaceRootname) return [];

  const result = await kSemanticModels
    .workspace()
    .getByRootname(workspaceRootname.workspaceRootname);
  const resources: GetResourcesResourceWrapper[] = result
    ? [
        {
          resourceId: result.resourceId,
          resourceType: AppResourceTypeMap.Workspace,
          resource: result,
          action: workspaceRootname.action,
        },
      ]
    : [];
  return resources;
};

async function authCheckResources(
  agent: SessionAgent,
  workspaceId: string,
  resources: Array<GetResourcesResourceWrapper>,
  nothrowOnCheckError?: boolean
) {
  const results = await Promise.all(
    resources.map(resource =>
      checkAuthorizationWithAgent({
        agent,
        workspaceId,
        nothrow: nothrowOnCheckError,
        target: {
          action: resource.action,
          targetId: getResourcePermissionContainers(workspaceId, resource.resource, true),
        },
      })
    )
  );

  const permitted = resources.filter((resource, index) => results[index].hasAccess);
  return permitted;
}
