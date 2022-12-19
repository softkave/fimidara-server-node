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
import {PermissionDeniedError} from '../../user/errors';
import {assertWorkspace} from '../../workspaces/utils';
import FolderQueries from '../queries';
import {
  checkFolderAuthorization02,
  folderListExtractor,
  getRootname,
} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  let fetchedFolders: IFolder[] = [];
  let fetchedFiles: IFile[] = [];
  let workspace: IWorkspace | null = null;
  let opCompleted = false;
  if (data.folderpath) {
    const rootname = getRootname(data.folderpath);
    if (rootname === data.folderpath) {
      workspace = await context.cacheProviders.workspace.getByRootname(
        context,
        rootname
      );

      assertWorkspace(workspace);
      const result = await fetchRootLevelContent(context, workspace.resourceId);
      fetchedFiles = result.files;
      fetchedFolders = result.folders;
      opCompleted = true;
    }
  }

  if (!opCompleted) {
    const result = await fetchFolderContent(context, agent, data);
    fetchedFiles = result.files;
    fetchedFolders = result.folders;
    workspace = result.workspace;
  }

  assertWorkspace(workspace);

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

  const folderPermittedReads = await waitOnPromises(
    checkFoldersPermissionQueue
  );

  const filePermittedReads = await waitOnPromises(checkFilesPermissionQueue);
  let allowedFolders = fetchedFolders.filter(
    (item, i) => !!folderPermittedReads[i]
  );

  let allowedFiles = fetchedFiles.filter((item, i) => !!filePermittedReads[i]);

  if (
    allowedFolders.length === 0 &&
    allowedFiles.length === 0 &&
    allowedFolders.length > 0 &&
    allowedFiles.length > 0
  ) {
    throw new PermissionDeniedError();
  }

  allowedFolders =
    await populateResourceListWithAssignedPermissionGroupsAndTags(
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
  };
};

async function fetchRootLevelContent(
  context: IBaseContext,
  workspaceId: string
) {
  const [folders, files] = await Promise.all([
    context.data.folder.getManyItems(FolderQueries.getRootFolders(workspaceId)),
    context.data.file.getManyItems(FileQueries.getRootFiles(workspaceId)),
  ]);

  return {folders, files};
}

async function fetchFolderContent(
  context: IBaseContext,
  agent: ISessionAgent,
  matcher: IFolderMatcher
) {
  const {folder, workspace} = await checkFolderAuthorization02(
    context,
    agent,
    matcher,
    BasicCRUDActions.Read
  );

  const [folders, files] = await Promise.all([
    context.data.folder.getManyItems(
      FolderQueries.getFoldersByParentId(folder.resourceId)
    ),
    context.data.file.getManyItems(
      FileQueries.getFilesByParentId(folder.resourceId)
    ),
  ]);

  return {folders, files, workspace};
}

export default listFolderContent;
