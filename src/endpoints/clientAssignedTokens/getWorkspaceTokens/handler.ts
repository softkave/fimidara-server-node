import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {getEndpointPageFromInput, getWorkspaceFromEndpointInput} from '../../utils';
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
  let tokens = await context.data.clientAssignedToken.getManyByQuery(q, data);
  tokens = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    tokens,
    AppResourceType.ClientAssignedToken
  );
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicClientToken(context, token)),
  };
};

export default getWorkspaceClientAssignedTokens;
