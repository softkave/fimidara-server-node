import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {getWorkspaceProgramAccessTokensQuery} from '../getWorkspaceTokens/utils';
import {GetWorkspaceProgramAccessTokenEndpoint} from './types';
import {countWorkspaceProgramAccessTokenJoiSchema} from './validation';

const countWorkspaceProgramAccessTokens: GetWorkspaceProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countWorkspaceProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceProgramAccessTokensQuery(context, agent, workspace);
  const count = await context.data.programAccessToken.countByQuery(q);
  return {count};
};

export default countWorkspaceProgramAccessTokens;
