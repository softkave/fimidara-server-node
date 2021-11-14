import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import FileQueries from '../queries';
import {FileUtils} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

const updateFileDetails: UpdateFileDetailsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const user = await context.session.getUser(context, instData);
  const file = await context.data.file.assertGetItem(
    FileQueries.getById(data.fileId)
  );

  const updatedFile = await context.data.file.assertUpdateItem(
    FileQueries.getById(file.fileId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: user.userId,
        agentType: SessionAgentType.User,
      },
    }
  );

  return {
    file: FileUtils.getPublicFile(updatedFile),
  };
};

export default updateFileDetails;
