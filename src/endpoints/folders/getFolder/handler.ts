import {kPermissionAgentTypes} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkFolderAuthorization02, folderExtractor} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

const getFolder: GetFolderEndpoint = async instData => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kPermissionAgentTypes);
  const {folder} = await checkFolderAuthorization02(agent, data, 'readFolder');

  return {folder: folderExtractor(folder)};
};

export default getFolder;
