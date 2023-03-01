import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedTags} from '../../assignedItems/getAssignedItems';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
  getWorkspaceFromEndpointInput,
} from '../../utils';
import {getPublicClientToken} from '../utils';
import {GetWorkspaceClientAssignedTokenEndpoint} from './types';
import {getWorkspaceClientAssignedTokensQuery} from './utils';
import {getWorkspaceClientAssignedTokenJoiSchema} from './validation';

const getWorkspaceClientAssignedTokens: GetWorkspaceClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceClientAssignedTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceClientAssignedTokensQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  let tokens = await context.data.clientAssignedToken.getManyByQuery(q, data);
  tokens = await populateResourceListWithAssignedTags(context, workspace.resourceId, tokens);
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicClientToken(context, token)),
  };
};

export default getWorkspaceClientAssignedTokens;
