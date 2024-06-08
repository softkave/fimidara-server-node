import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkFolderAuthorization02, folderExtractor} from '../utils.js';
import {GetFolderEndpoint} from './types.js';
import {getFolderJoiSchema} from './validation.js';

const getFolder: GetFolderEndpoint = async instData => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {folder} = await checkFolderAuthorization02(agent, data, 'readFolder');

  return {folder: folderExtractor(folder)};
};

export default getFolder;
