import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../queries';
import {checkFileAuthorization03} from '../utils';
import {DeleteFileEndpoint} from './types';
import {deleteFileJoiSchema} from './validation';

const deleteFile: DeleteFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteFileJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {file} = await checkFileAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Delete
  );

  await context.data.file.deleteItem(FileQueries.getById(file.fileId));
};

export default deleteFile;
