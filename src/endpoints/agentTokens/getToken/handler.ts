import {AppActionType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenAuthorization02, getPublicAgentToken} from '../utils';
import {GetAgentTokenEndpoint} from './types';
import {getAgentTokenJoiSchema} from './validation';

const getAgentToken: GetAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, getAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(context, agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  let {token} = await checkAgentTokenAuthorization02(
    context,
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    AppActionType.Read
  );
  appAssert(token.workspaceId);
  token = await populateAssignedTags(context, token.workspaceId, token);
  return {token: getPublicAgentToken(context, token)};
};

export default getAgentToken;
