import assert from 'assert';
import {compact, get, map, mapKeys} from 'lodash-es';
import {
  checkAuthorizationWithAgent,
  getResourcePermissionContainers,
} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  FimidaraResourceType,
  Resource,
  ResourceWrapper,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {ServerError} from '../../utils/errors.js';
import {
  convertToArray,
  isObjectEmpty,
  pathJoin,
  pathSplit,
} from '../../utils/fns.js';
import {indexArray} from '../../utils/indexArray.js';
import {getResourceTypeFromId} from '../../utils/resource.js';
import {PartialRecord} from '../../utils/types.js';
import {
  PromiseWithId,
  waitOnPromisesWithId,
} from '../../utils/waitOnPromises.js';
import {getFilepathInfo, stringifyFilenamepath} from '../files/utils.js';
import {getFolderpathInfo, stringifyFolderpath} from '../folders/utils.js';
import {checkResourcesBelongsToWorkspace} from './containerCheckFns.js';
import {resourceListWithAssignedItems} from './resourceWithAssignedItems.js';
import {FetchResourceItem} from './types.js';

interface ExtendedPromiseWithId<T> extends PromiseWithId<T> {
  resourceType: FimidaraResourceType;
}

type InputsWithIdGroupedByType = PartialRecord<
  FimidaraResourceType,
  Record</** resource ID */ string, FimidaraPermissionAction>
>;

type FilePathsMap = PartialRecord<
  /** filepath or folderpath */ string,
  FimidaraPermissionAction
>;

interface WorkspaceRootnameWithAction {
  workspaceRootname: string;
  action: FimidaraPermissionAction;
}

export interface GetResourcesOptions {
  inputResources: Array<FetchResourceItem>;
  allowedTypes: FimidaraResourceType[];
  checkAuth?: boolean;
  agent: SessionAgent;
  workspaceId: string;
  nothrowOnCheckError?: boolean;
  dataFetchRunOptions?: SemanticProviderOpParams;

  /** User workspaces are automatically filled-in if `checkAuth` is true. */
  fillAssignedItems?: boolean;

  /** Will fill-in user workspaces if is `true` even if `fillAssignedItems` is
   * false. */
  checkBelongsToWorkspace?: boolean;
}

type GetResourcesResourceWrapper = ResourceWrapper & {
  action: FimidaraPermissionAction;
};

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
        kFimidaraResourceType.User,
      ]);
      assignedItemsFilled = true;
    }

    checkResourcesBelongsToWorkspace(workspaceId, resources);
  }

  if (checkAuth) {
    if (!assignedItemsFilled) {
      resources = await resourceListWithAssignedItems(workspaceId, resources, [
        kFimidaraResourceType.User,
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
  allowedTypes: FimidaraResourceType[]
) {
  const inputsWithIdByType: InputsWithIdGroupedByType = {};
  const filepathsMap: FilePathsMap = {};
  const folderpathsMap: FilePathsMap = {};
  const allowedTypesMap = indexArray(allowedTypes);
  let workspaceRootname: WorkspaceRootnameWithAction | undefined = undefined;

  inputResources.forEach(item => {
    if (item.resourceId) {
      const idList = convertToArray(item.resourceId);
      idList.forEach(resourceId => {
        const type = getResourceTypeFromId(resourceId);

        if (
          allowedTypesMap[kFimidaraResourceType.All] ||
          allowedTypesMap[type]
        ) {
          let inputByIdMap = inputsWithIdByType[type];

          if (!inputByIdMap) {
            inputsWithIdByType[type] = inputByIdMap = {};
          }

          inputByIdMap[resourceId] = item.action;
        }
      });
    } else if (item.filepath) {
      convertToArray(item.filepath).forEach(filepath => {
        filepathsMap[pathJoin(pathSplit(filepath).slice(1))] = item.action;
      });
    } else if (item.folderpath) {
      convertToArray(item.folderpath).forEach(folderpath => {
        folderpathsMap[pathJoin(pathSplit(folderpath).slice(1))] = item.action;
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
  opts?: SemanticProviderOpParams
) {
  if (isObjectEmpty(idsGroupedByType)) return [];

  const promises: Array<ExtendedPromiseWithId<Resource[]>> = [];
  mapKeys(idsGroupedByType, (typeMap, type) => {
    appAssert(typeMap, 'typeMap is undefined');
    switch (type) {
      case kFimidaraResourceType.Workspace: {
        promises.push({
          id: kFimidaraResourceType.Workspace,
          promise: kSemanticModels
            .workspace()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.CollaborationRequest: {
        promises.push({
          id: kFimidaraResourceType.CollaborationRequest,
          promise: kSemanticModels
            .collaborationRequest()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.AgentToken: {
        promises.push({
          id: kFimidaraResourceType.AgentToken,
          promise: kSemanticModels
            .agentToken()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.PermissionGroup: {
        promises.push({
          id: kFimidaraResourceType.PermissionGroup,
          promise: kSemanticModels
            .permissionGroup()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.PermissionItem: {
        promises.push({
          id: kFimidaraResourceType.PermissionItem,
          promise: kSemanticModels
            .permissionItem()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.Folder: {
        promises.push({
          id: kFimidaraResourceType.Folder,
          promise: kSemanticModels
            .folder()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.File: {
        promises.push({
          id: kFimidaraResourceType.File,
          promise: kSemanticModels
            .file()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      case kFimidaraResourceType.User: {
        promises.push({
          id: kFimidaraResourceType.User,
          promise: kSemanticModels
            .user()
            .getManyByIdList(Object.keys(typeMap), opts),
          resourceType: type,
        });
        break;
      }
      default:
        appAssert(
          false,
          new ServerError(),
          `Unsupported resource type ${type}`
        );
    }
  });

  const resources: Array<GetResourcesResourceWrapper> = [];
  const settledPromises = await waitOnPromisesWithId(promises);

  settledPromises.forEach(item => {
    if (item.resolved) {
      item.value?.forEach(resource => {
        const action = get(idsGroupedByType, [
          item.resourceType,
          resource.resourceId,
        ]);
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
      kSemanticModels.file().getOneByNamepath({
        workspaceId,
        ...getFilepathInfo(filepath, {
          containsRootname: false,
          allowRootFolder: false,
        }),
      })
    )
  );

  return compact(result).map((item): GetResourcesResourceWrapper => {
    const action = filepathsMap[stringifyFilenamepath(item)];
    assert(action);
    return {
      action,
      resourceId: item.resourceId,
      resourceType: kFimidaraResourceType.File,
      resource: item,
    };
  });
};

const fetchFolders = async (
  workspaceId: string,
  folderpathsMap: FilePathsMap
) => {
  if (isObjectEmpty(folderpathsMap)) return [];

  const result = await Promise.all(
    // TODO: can we have $or or implement $in for array of arrays?
    map(folderpathsMap, (action, folderpath) =>
      kSemanticModels.folder().getOneByNamepath({
        workspaceId,
        ...getFolderpathInfo(folderpath, {
          containsRootname: false,
          allowRootFolder: false,
        }),
      })
    )
  );

  return compact(result).map((item): GetResourcesResourceWrapper => {
    const action = folderpathsMap[stringifyFolderpath(item)];
    assert(action);
    return {
      action,
      resourceId: item.resourceId,
      resourceType: kFimidaraResourceType.Folder,
      resource: item,
    };
  });
};

const fetchWorkspace = async (
  workspaceRootname?: WorkspaceRootnameWithAction
) => {
  if (!workspaceRootname) {
    return [];
  }

  const result = await kSemanticModels
    .workspace()
    .getByRootname(workspaceRootname.workspaceRootname);
  const resources: GetResourcesResourceWrapper[] = result
    ? [
        {
          resourceId: result.resourceId,
          resourceType: kFimidaraResourceType.Workspace,
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
          targetId: getResourcePermissionContainers(
            workspaceId,
            resource.resource,
            true
          ),
        },
      })
    )
  );

  const permitted = resources.filter((resource, index) =>
    results[index].every(check => check.hasAccess)
  );
  return permitted;
}
