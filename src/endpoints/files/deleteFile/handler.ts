import {validate} from '../../../utilities/validate';
import FileQueries from '../queries';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  await context.session.getUser(context, instData);
  await context.data.file.deleteItem(FileQueries.getById(data.fileId));
};

export default deleteFile;
