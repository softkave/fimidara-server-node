import {IFile} from '../../../definitions/file';
import {IFolder, IFolderMatcher} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {resourceListWithAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../../files/queries';
import {fileListExtractor} from '../../files/utils';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import FolderQueries from '../queries';
import {
  checkFolderAuthorization02,
  folderListExtractor,
  getFolderMatcher,
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

  const organizationId = getOrganizationId(agent, data.organizationId);
  const organization = await context.data.organization.assertGetItem(
    EndpointReusableQueries.getById(organizationId)
  );

  let fetchedFolders: IFolder[] = [];
  let fetchedFiles: IFile[] = [];

  if (!data.folderpath && !data.folderId) {
    const result = await fetchRootLevelContent(context, organizationId);
    fetchedFiles = result.files;
    fetchedFolders = result.folders;
  } else {
    const result = await fetchFolderContent(
      context,
      agent,
      getFolderMatcher(agent, data)
    );

    fetchedFiles = result.files;
    fetchedFolders = result.folders;
  }

  // TODO: can we do this together, so that we don't waste compute
  const checkFoldersPermissionQueue = fetchedFolders.map(item =>
    checkAuthorization({
      context,
      agent,
      organization,
      resource: item,
      type: AppResourceType.Folder,
      permissionOwners: makeOrgPermissionOwnerList(organizationId),
      action: BasicCRUDActions.Read,
      nothrow: true,
    })
  );

  const checkFilesPermissionQueue = fetchedFiles.map(item =>
    checkAuthorization({
      context,
      agent,
      organization,
      resource: item,
      type: AppResourceType.File,
      permissionOwners: makeOrgPermissionOwnerList(organizationId),
      action: BasicCRUDActions.Read,
      nothrow: true,
    })
  );

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

  allowedFolders = await resourceListWithAssignedPresetsAndTags(
    context,
    organization.resourceId,
    allowedFolders,
    AppResourceType.Folder
  );

  allowedFiles = await resourceListWithAssignedPresetsAndTags(
    context,
    organization.resourceId,
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
  matcher: IFolderMatcher
) {
  const {folder} = await checkFolderAuthorization02(
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

  return {folders, files};
}

export default listFolderContent;
