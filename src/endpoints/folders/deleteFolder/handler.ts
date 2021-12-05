import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../../files/queries';
import FolderQueries from '../queries';
import {
  assertSplitFolderPath,
  checkFolderAuthorization02,
  checkFolderAuthorization03,
} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const splitPath = assertSplitFolderPath(data.path);
  const {folder} = await checkFolderAuthorization03(
    context,
    agent,
    organizationId,
    splitPath,
    BasicCRUDActions.Delete
  );

  await context.data.folder.deleteManyItems(
    FolderQueries.getFoldersWithNamePath(organizationId, splitPath)
  );
  await context.data.file.deleteManyItems(
    FileQueries.getFilesByParentId(folder.folderId)
  );

  // TODO:
  // delete permission items
};

export default deleteFolder;
