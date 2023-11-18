import {PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {folder} = await checkFolderAuthorization02(context, agent, data, 'readFolder');
  return {folder: folderExtractor(folder)};
};

export default getFolder;
