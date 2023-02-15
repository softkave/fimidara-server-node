import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils';
import {GetWorkspaceEndpoint} from './types';
import {getWorkspaceJoiSchema} from './validation';

const getWorkspace: GetWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    workspaceId,
    BasicCRUDActions.Delete
  );

  return {
    workspace: workspaceExtractor(workspace),
  };
};

export default getWorkspace;
