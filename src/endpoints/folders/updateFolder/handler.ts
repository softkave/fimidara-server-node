import {SessionAgentType} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import FolderQueries from '../queries';
import {folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const user = await context.session.getUser(context, instData);
  const folder = await context.folder.assertGetFolderById(
    context,
    data.folderId
  );

  const updatedFolder = await context.data.folder.assertUpdateItem(
    FolderQueries.getById(folder.folderId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: user.userId,
        agentType: SessionAgentType.User,
      },
    }
  );

  return {folder: folderExtractor(updatedFolder)};
};

export default updateFolder;
