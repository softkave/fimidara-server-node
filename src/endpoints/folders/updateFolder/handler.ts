import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import FolderQueries from '../queries';
import {checkFolderAuthorizationWithPath, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {folder} = await checkFolderAuthorizationWithPath(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Update
  );

  const updatedFolder = await context.data.folder.assertUpdateItem(
    FolderQueries.getById(folder.folderId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }
  );

  return {folder: folderExtractor(updatedFolder)};
};

export default updateFolder;
