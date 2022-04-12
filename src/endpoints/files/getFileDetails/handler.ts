import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkFileAuthorization03,
  fileExtractor,
  getFileMatcher,
} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  let {file} = await checkFileAuthorization03(
    context,
    agent,
    getFileMatcher(agent, data),
    BasicCRUDActions.Read
  );

  file = await withAssignedPresetsAndTags(
    context,
    file.workspaceId,
    file,
    AppResourceType.File
  );

  return {
    file: fileExtractor(file),
  };
};

export default getFileDetails;
