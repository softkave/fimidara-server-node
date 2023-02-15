import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {getWorkspaceClientAssignedTokensQuery} from '../getWorkspaceTokens/utils';
import {CountWorkspaceClientAssignedTokenEndpoint} from './types';
import {countWorkspaceClientAssignedTokenJoiSchema} from './validation';

const countWorkspaceClientAssignedTokens: CountWorkspaceClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countWorkspaceClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceClientAssignedTokensQuery(context, agent, workspace);
  const count = await context.data.clientAssignedToken.countByQuery(q);
  return {count};
};

export default countWorkspaceClientAssignedTokens;
