import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import FileQueries from '../queries';
import {checkFileAuthorizationWithPath, FileUtils} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

const updateFileDetails: UpdateFileDetailsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const {file, agent} = await checkFileAuthorizationWithPath(
    context,
    instData,
    data.path,
    BasicCRUDActions.Update
  );

  const updatedFile = await context.data.file.assertUpdateItem(
    FileQueries.getById(file.fileId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }
  );

  return {
    file: FileUtils.getPublicFile(updatedFile),
  };
};

export default updateFileDetails;
