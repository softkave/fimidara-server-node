import {PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {fileExtractor, readAndCheckFileAuthorization} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async instData => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);
  const file = await kSemanticModels
    .utils()
    .withTxn(opts => readAndCheckFileAuthorization(agent, data, 'readFile', opts));

  return {file: fileExtractor(file)};
};

export default getFileDetails;
