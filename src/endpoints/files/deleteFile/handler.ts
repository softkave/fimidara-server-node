import {validate} from '../../../utilities/validate';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  await context.session.assertUser(context, instData);
  await context.file.deleteFile(context, data.fileId);

  // TODO:
  // delete environments
  // delete spaces
  // delete buckets
  // delete program access keys
  // delete client assigned keys
  // remove files in users
  // delete files
};

export default deleteFile;
