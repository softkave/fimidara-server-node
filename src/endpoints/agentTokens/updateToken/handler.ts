import {omit} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken';
import {AppActionType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent, tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists';
import {assertAgentToken, checkAgentTokenAuthorization02, getPublicAgentToken} from '../utils';
import {UpdateAgentTokenEndpoint} from './types';
import {updateAgentTokenJoiSchema} from './validation';

const updateAgentToken: UpdateAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(context, agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  let {token} = await checkAgentTokenAuthorization02(
    context,
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    AppActionType.Update
  );

  const updatedToken = await context.semantic.utils.withTxn(context, async opts => {
    const tokenUpdate: Partial<AgentToken> = {
      ...omit(data.token, 'tags'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const isNameChanged =
      tokenUpdate.name && tokenUpdate.name.toLowerCase() !== token.name?.toLowerCase();

    appAssert(token.workspaceId);
    await Promise.all([
      isNameChanged &&
        checkAgentTokenNameExists(context, token.workspaceId, tokenUpdate.name!, opts),
    ]);

    const updatedToken = await context.semantic.agentToken.getAndUpdateOneById(
      token.resourceId,
      tokenUpdate,
      opts
    );

    assertAgentToken(updatedToken);
    return updatedToken;
  });

  appAssert(updatedToken.workspaceId);
  const agentToken = await populateAssignedTags(context, updatedToken.workspaceId, updatedToken);
  return {token: getPublicAgentToken(context, agentToken)};
};

export default updateAgentToken;
