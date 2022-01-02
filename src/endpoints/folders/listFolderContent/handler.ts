import {IFile} from '../../../definitions/file';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../../files/queries';
import {FileUtils} from '../../files/utils';
import FolderQueries from '../queries';
import {checkFolderAuthorization03, FolderUtils} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {listFolderContentJoiSchema} from './validation';

/**
 * listFolderContent:
 * For fetching a folder's content, mainly folders and files contained in the folder.
 * Can also be used to fetch the root-level files and folders, i.e the ones that do not
 * have a parent folder.
 *
 * Ensure that:
 * - Auth check for agent and folder & organization
 * - Determine if to fetch root level content or folder content
 * - Fetch files and folders and check read access
 */

const listFolderContent: ListFolderContentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  let fetchedFolders: IFolder[] = [];
  let fetchedFiles: IFile[] = [];

  if (data.path === '') {
    const result = await fetchRootLevelContent(context, organizationId);
    fetchedFiles = result.files;
    fetchedFolders = result.folders;
  } else {
    const result = await fetchFolderContent(
      context,
      agent,
      organizationId,
      data.path
    );

    fetchedFiles = result.files;
    fetchedFolders = result.folders;
  }

  // TODO: can we do this together, so that we don't waste compute
  const checkFoldersPermissionQueue = fetchedFolders.map(item =>
    checkAuthorization(
      context,
      agent,
      organizationId,
      item.folderId,
      AppResourceType.Folder,
      makeBasePermissionOwnerList(organizationId),
      BasicCRUDActions.Read,
      true
    )
  );

  const checkFilesPermissionQueue = fetchedFiles.map(item =>
    checkAuthorization(
      context,
      agent,
      organizationId,
      item.fileId,
      AppResourceType.File,
      makeBasePermissionOwnerList(organizationId),
      BasicCRUDActions.Read,
      true
    )
  );

  const folderPermittedReads = await waitOnPromises(
    checkFoldersPermissionQueue
  );
  const filePermittedReads = await waitOnPromises(checkFilesPermissionQueue);
  const allowedFolders = fetchedFolders.filter(
    (item, i) => !!folderPermittedReads[i]
  );
  const allowedFiles = fetchedFiles.filter(
    (item, i) => !!filePermittedReads[i]
  );

  return {
    folders: FolderUtils.getPublicFolderList(allowedFolders),
    files: FileUtils.getPublicFileList(allowedFiles),
  };
};

async function fetchRootLevelContent(
  context: IBaseContext,
  organizationId: string
) {
  const [folders, files] = await Promise.all([
    context.data.folder.getManyItems(
      FolderQueries.getRootFolders(organizationId)
    ),
    context.data.file.getManyItems(FileQueries.getRootFiles(organizationId)),
  ]);

  return {folders, files};
}

async function fetchFolderContent(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  path: string
) {
  const {folder} = await checkFolderAuthorization03(
    context,
    agent,
    organizationId,
    path,
    BasicCRUDActions.Read
  );

  const [folders, files] = await Promise.all([
    context.data.folder.getManyItems(
      FolderQueries.getFoldersByParentId(folder.folderId)
    ),
    context.data.file.getManyItems(
      FileQueries.getFilesByParentId(folder.folderId)
    ),
  ]);

  return {folders, files};
}

export default listFolderContent;
