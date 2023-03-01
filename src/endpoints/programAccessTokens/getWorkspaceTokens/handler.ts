import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedTags} from '../../assignedItems/getAssignedItems';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
  getWorkspaceFromEndpointInput,
} from '../../utils';
import {getPublicProgramToken} from '../utils';
import {GetWorkspaceProgramAccessTokenEndpoint} from './types';
import {getWorkspaceProgramAccessTokensQuery} from './utils';
import {getWorkspaceProgramAccessTokenJoiSchema} from './validation';

const getWorkspaceProgramAccessTokens: GetWorkspaceProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceProgramAccessTokensQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  let tokens = await context.data.programAccessToken.getManyByQuery(q, data);
  tokens = await populateResourceListWithAssignedTags(context, workspace.resourceId, tokens);
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicProgramToken(context, token)),
  };
};

export default getWorkspaceProgramAccessTokens;
