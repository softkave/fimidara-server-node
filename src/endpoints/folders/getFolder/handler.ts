import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkFolderAuthorization02, folderExtractor} from '../utils.js';
import {GetFolderEndpoint} from './types.js';
import {getFolderJoiSchema} from './validation.js';

const getFolder: GetFolderEndpoint = async reqData => {
  const data = validate(reqData.data, getFolderJoiSchema);
  const {agent} = await initEndpoint(reqData, {data});

  const {folder} = await checkFolderAuthorization02(agent, data, 'readFolder');

  return {folder: folderExtractor(folder)};
};

export default getFolder;
