import {first, isUndefined} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  makeResourcePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {fileListExtractor} from '../../files/utils';
import {IPaginationQuery} from '../../types';
import {PermissionDeniedError} from '../../user/errors';
import {getEndpointPageFromInput} from '../../utils';
import WorkspaceQueries from '../../workspaces/queries';
import {assertWorkspace} from '../../workspaces/utils';
import FolderQueries from '../queries';
import {checkFolderAuthorization02, folderListExtractor, getWorkspaceRootnameFromPath} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async (context, instData) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData, publicPermissibleEndpointAgents);
  let workspace: IWorkspace | null | undefined = null,
    parentFolder: IFolder | null | undefined = undefined;

  // Check if folderpath is rootname only and fetch root-level folders and files
  if (data.folderpath) {
    const {rootname, splitPath} = getWorkspaceRootnameFromPath(data.folderpath);
    const containsRootnameOnly = first(splitPath) === rootname && splitPath.length === 1;
    if (containsRootnameOnly) {
      workspace = await context.data.workspace.getOneByQuery(WorkspaceQueries.getByRootname(rootname));
      parentFolder = null;
    }
  }

  // Fetch using folder matcher if folderpath is not rootname only
  if (isUndefined(parentFolder)) {
    const checkResult = await checkFolderAuthorization02(
      context,
      agent,
      data,
      BasicCRUDActions.Read,
      /** nothrow */ false,
      workspace ?? undefined
    );
    workspace = checkResult.workspace;
    parentFolder = checkResult.folder;
  }

  // add sort to fetching with IDs

  assertWorkspace(workspace);
  appAssert(!isUndefined(parentFolder), new ServerError(), 'Parent folder should be null or folder, not undefined');
  let [fetchedFolders, fetchedFiles] = await Promise.all([
    fetchFolders(context, agent, workspace, parentFolder, data),
    fetchFiles(context, agent, workspace, parentFolder, data),
  ]);
  fetchedFolders = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    fetchedFolders,
    AppResourceType.Folder
  );
  fetchedFiles = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    fetchedFiles,
    AppResourceType.File
  );

  return {
    folders: folderListExtractor(fetchedFolders),
    files: fileListExtractor(fetchedFiles),
    page: getEndpointPageFromInput(data),
  };
};

async function fetchFolders(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  parentFolder: IFolder | null,
  pagination: IPaginationQuery
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.Folder,
    permissionContainers: makeResourcePermissionContainerList(
      workspace.resourceId,
      AppResourceType.Folder,
      parentFolder
    ),
    action: BasicCRUDActions.Read,
  });

  let fetchedFolders: Array<IFolder> = [];
  const parentId = parentFolder?.resourceId ?? null;

  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    fetchedFolders = await context.data.folder.getManyByQuery(
      FolderQueries.getByParentId(
        workspace.resourceId,
        parentId,
        undefined,
        permissionsSummaryReport.deniedResourceIdList
      ),
      pagination
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    fetchedFolders = await context.data.folder.getManyByQuery(
      FolderQueries.getByParentId(workspace.resourceId, parentId, permissionsSummaryReport.allowedResourceIdList),
      pagination
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  return fetchedFolders;
}

async function fetchFiles(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  parentFolder: IFolder | null,
  pagination: IPaginationQuery
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.Folder,
    permissionContainers: makeResourcePermissionContainerList(
      workspace.resourceId,
      AppResourceType.Folder,
      parentFolder
    ),
    action: BasicCRUDActions.Read,
  });
  let fetchedFiles: Array<IFile> = [];
  const parentId = parentFolder?.resourceId ?? null;

  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    fetchedFiles = await context.data.file.getManyByQuery(
      FolderQueries.getByParentId(
        workspace.resourceId,
        parentId,
        undefined,
        permissionsSummaryReport.deniedResourceIdList
      ),
      pagination
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    fetchedFiles = await context.data.file.getManyByQuery(
      FolderQueries.getByParentId(workspace.resourceId, parentId, permissionsSummaryReport.allowedResourceIdList),
      pagination
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  return fetchedFiles;
}

export default listFolderContent;
