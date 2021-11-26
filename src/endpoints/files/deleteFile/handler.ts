import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import FileQueries from '../queries';
import {checkFileAuthorizationWithFileId} from '../utils';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  await checkFileAuthorizationWithFileId(
    context,
    agent,
    data.fileId,
    BasicCRUDActions.Delete
  );

  await context.data.file.deleteItem(FileQueries.getById(data.fileId));
};

export default deleteFile;
