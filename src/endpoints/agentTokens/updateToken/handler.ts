import {omit} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {
  getActionAgentFromSessionAgent,
  tryGetAgentTokenId,
} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists';
import {
  assertAgentToken,
  checkAgentTokenAuthorization02,
  getPublicAgentToken,
} from '../utils';
import {UpdateAgentTokenEndpoint} from './types';
import {updateAgentTokenJoiSchema} from './validation';

const updateAgentToken: UpdateAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, updateAgentTokenJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    'updateAgentToken'
  );

  const updatedToken = await kSemanticModels.utils().withTxn(async opts => {
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
        checkAgentTokenNameExists(token.workspaceId, tokenUpdate.name!, opts),
    ]);

    const updatedToken = await kSemanticModels
      .agentToken()
      .getAndUpdateOneById(token.resourceId, tokenUpdate, opts);

    assertAgentToken(updatedToken);
    return updatedToken;
  });

  appAssert(updatedToken.workspaceId);
  const agentToken = await populateAssignedTags(updatedToken.workspaceId, updatedToken);
  return {token: getPublicAgentToken(agentToken)};
};

export default updateAgentToken;
