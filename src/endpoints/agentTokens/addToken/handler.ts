import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {getPublicAgentToken} from '../utils';
import {AddAgentTokenEndpoint} from './types';
import {internalCreateAgentToken} from './utils';
import {addAgentTokenJoiSchema} from './validation';

const addAgentToken: AddAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const token = await internalCreateAgentToken(context, agent, workspace, data.token);
  return {token: getPublicAgentToken(context, token)};
};

export default addAgentToken;
