import {PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {checkFileAuthorization02, fileExtractor} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {file} = await checkFileAuthorization02(context, agent, data, 'readFile');
  return {
    file: fileExtractor(file),
  };
};

export default getFileDetails;
