import {validate} from '../../../utilities/validate';
import {DeleteFolderEndpoint} from './types';
import {deleteFolderJoiSchema} from './validation';

const deleteFolder: DeleteFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFolderJoiSchema);
  await context.session.assertUser(context, instData);
  await context.folder.deleteFolder(context, data.folderId);

  // TODO:
  // delete folders
  // delete spaces
  // delete buckets
  // delete program access keys
  // delete client assigned keys
  // remove folders in users
  // delete files
};

export default deleteFolder;
