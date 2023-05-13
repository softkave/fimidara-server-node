import {AppActionType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils';
import {GetWorkspaceEndpoint} from './types';
import {getWorkspaceJoiSchema} from './validation';

const getWorkspace: GetWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    AppActionType.Read,
    data.workspaceId
  );
  return {workspace: workspaceExtractor(workspace)};
};

export default getWorkspace;
