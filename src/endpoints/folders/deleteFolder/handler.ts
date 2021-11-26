import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import FolderQueries from '../queries';
import {checkFolderAuthorizationWithFolderId} from '../utils';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  await checkFolderAuthorizationWithFolderId(
    context,
    agent,
    data.folderId,
    BasicCRUDActions.Delete
  );

  await context.data.file.deleteItem(FolderQueries.getById(data.folderId));

  // TODO:
  // delete children folders and files
  // delete permission items
};

export default deleteFolder;
