import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIkxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {checkFolderAuthorization02, folderExtractor} from '../utils.js';
import {GetFolderEndpoint} from './types.js';
import {getFolderJoiSchema} from './validation.js';

const getFolder: GetFolderEndpoint = async reqData => {
  const data = validate(reqData.data, getFolderJoiSchema);
  const agent = await kIkxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {folder} = await checkFolderAuthorization02(agent, data, 'readFolder');

  return {folder: folderExtractor(folder)};
};

export default getFolder;
