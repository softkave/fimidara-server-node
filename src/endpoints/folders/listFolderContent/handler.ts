import assert from 'assert';
import {first} from 'lodash';
import {IFile} from '../../../definitions/file';
import {IFolder, IFolderMatcher} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import FileQueries from '../../files/queries';
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
  let workspace: IWorkspace | null | undefined = null;
  let result: IFetchFolderContentResult | null = null;

  // Check if folderpath is rootname only and fetch root-level folders and files
  if (data.folderpath) {
    const {rootname, splitPath} = getWorkspaceRootnameFromPath(data.folderpath);
    const containsRootnameOnly = first(splitPath) === rootname && splitPath.length === 1;
    if (containsRootnameOnly) {
      workspace = await context.data.workspace.getOneByQuery(WorkspaceQueries.getByRootname(rootname));
      assertWorkspace(workspace);
      result = await fetchRootLevelContent(context, workspace.resourceId, data);
    }
  }

  // Fetch using folder matcher if folderpath is not rootname only
  if (!result) {
    const result = await fetchFolderContent(context, agent, data, data);
    workspace = result.workspace;
  }

  assertWorkspace(workspace);
  assert(result);
  const fetchedFolders = result.folders;
  const fetchedFiles = result.files;

  // TODO: can we do this together, so that we don't waste compute
  const checkFoldersPermissionQueue = fetchedFolders.map(item => {
    const w = workspace as IWorkspace;
    return checkAuthorization({
      context,
      agent,
      workspace: w,
      resource: item,
      type: AppResourceType.Folder,
      permissionOwners: makeWorkspacePermissionOwnerList(w.resourceId),
      action: BasicCRUDActions.Read,
      nothrow: true,
    });
  });

  const checkFilesPermissionQueue = fetchedFiles.map(item => {
    const w = workspace as IWorkspace;
    return checkAuthorization({
      context,
      agent,
      workspace: w,
      resource: item,
      type: AppResourceType.File,
      permissionOwners: makeWorkspacePermissionOwnerList(w.resourceId),
      action: BasicCRUDActions.Read,
      nothrow: true,
    });
  });

  const folderPermittedReads = await waitOnPromises(checkFoldersPermissionQueue);
  const filePermittedReads = await waitOnPromises(checkFilesPermissionQueue);
  let allowedFolders = fetchedFolders.filter((item, i) => !!folderPermittedReads[i]);
  let allowedFiles = fetchedFiles.filter((item, i) => !!filePermittedReads[i]);
  if (
    allowedFolders.length === 0 &&
    allowedFiles.length === 0 &&
    allowedFolders.length > 0 &&
    allowedFiles.length > 0
  ) {
    throw new PermissionDeniedError();
  }

  allowedFolders = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    allowedFolders,
    AppResourceType.Folder
  );
  allowedFiles = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    allowedFiles,
    AppResourceType.File
  );

  return {
    folders: folderListExtractor(allowedFolders),
    files: fileListExtractor(allowedFiles),
    page: getEndpointPageFromInput(data),
  };
};

interface IFetchFolderContentResult {
  folders: Array<IFolder>;
  files: Array<IFile>;
  workspace?: IWorkspace | null;
}

async function fetchRootLevelContent(
  context: IBaseContext,
  workspaceId: string,
  p: IPaginationQuery
): Promise<IFetchFolderContentResult> {
  const [folders, files] = await Promise.all([
    context.data.folder.getManyByQuery(FolderQueries.getRootFolders(workspaceId), p),
    context.data.file.getManyByQuery(FileQueries.getRootFiles(workspaceId), p),
  ]);
  return {folders, files};
}

async function fetchFolderContent(
  context: IBaseContext,
  agent: ISessionAgent,
  matcher: IFolderMatcher,
  p: IPaginationQuery
): Promise<IFetchFolderContentResult> {
  const {folder, workspace} = await checkFolderAuthorization02(context, agent, matcher, BasicCRUDActions.Read);
  const [folders, files] = await Promise.all([
    context.data.folder.getManyByQuery(FolderQueries.getFoldersByParentId(folder.resourceId), p),
    context.data.file.getManyByQuery(FileQueries.getFilesByParentId(folder.resourceId), p),
  ]);
  return {folders, files, workspace};
}

export default listFolderContent;
