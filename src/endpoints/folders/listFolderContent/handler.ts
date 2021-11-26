import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorizationForFile,
  checkAuthorizationForFolder,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../../files/queries';
import {FileUtils} from '../../files/utils';
import FolderQueries from '../queries';
import {checkFolderAuthorizationWithPath, FolderUtils} from '../utils';
import {ListFolderContentEndpoint} from './types';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {folder} = await checkFolderAuthorizationWithPath(
    context,
    agent,
    organizationId,
    data.path,
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

  // TODO: can we do this together, so that we don't waste compute
  const folderPreparedChecks = folders.map(item =>
    checkAuthorizationForFolder(
      context,
      agent,
      organizationId,
      item,
      BasicCRUDActions.Read
    )
  );

  const filePreparedChecks = files.map(item =>
    checkAuthorizationForFile(
      context,
      agent,
      organizationId,
      item,
      BasicCRUDActions.Read
    )
  );

  const folderPermittedReads = await Promise.all(folderPreparedChecks);
  const filePermittedReads = await Promise.all(filePreparedChecks);
  const allowedFolders = folders.filter((item, i) => !!folderPermittedReads[i]);
  const allowedFiles = files.filter((item, i) => !!filePermittedReads[i]);

  return {
    folders: FolderUtils.getPublicFolderList(allowedFolders),
    files: FileUtils.getPublicFileList(allowedFiles),
  };
};

export default listFolderContent;
