import {BasicCRUDActions, PUBLIC_PERMISSIBLE_AGENTS} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkFileAuthorization03, fileExtractor} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await context.session.getAgent(context, instData, PUBLIC_PERMISSIBLE_AGENTS);
  let {file} = await checkFileAuthorization03(context, agent, data, BasicCRUDActions.Read);
  file = await populateAssignedTags(context, file.workspaceId, file);
  return {
    file: fileExtractor(file),
  };
};

export default getFileDetails;
