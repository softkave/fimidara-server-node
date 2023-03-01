import {BasicCRUDActions, PUBLIC_PERMISSIBLE_AGENTS} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PUBLIC_PERMISSIBLE_AGENTS);
  let {folder} = await checkFolderAuthorization02(context, agent, data, BasicCRUDActions.Read);
  folder = await populateAssignedTags(context, folder.workspaceId, folder);
  return {
    folder: folderExtractor(folder),
  };
};

export default getFolder;
