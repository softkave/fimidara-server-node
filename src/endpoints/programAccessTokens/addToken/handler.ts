import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getPublicProgramToken} from '../utils';
import {AddProgramAccessTokenEndpoint} from './types';
import {internalCreateProgramAccessToken} from './utils';
import {addProgramAccessTokenJoiSchema} from './validation';

const addProgramAccessToken: AddProgramAccessTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  const token = await internalCreateProgramAccessToken(context, agent, workspace, data.token);
  return {token: getPublicProgramToken(context, token)};
};

export default addProgramAccessToken;
