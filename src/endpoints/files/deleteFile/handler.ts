import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import FileQueries from '../queries';
import {checkFileAuthorizationWithFileId} from '../utils';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  await checkFileAuthorizationWithFileId(
    context,
    instData,
    data.fileId,
    BasicCRUDActions.Delete
  );

  await context.data.file.deleteItem(FileQueries.getById(data.fileId));
};

export default deleteFile;
