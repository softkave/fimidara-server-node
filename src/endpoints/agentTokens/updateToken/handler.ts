import {omit} from 'lodash-es';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists.js';
import {
  assertAgentToken,
  checkAgentTokenAuthorization02,
  getPublicAgentToken,
} from '../utils.js';
import {UpdateAgentTokenEndpoint} from './types.js';
import {updateAgentTokenJoiSchema} from './validation.js';

const updateAgentTokenEndpoint: UpdateAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, updateAgentTokenJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspaceId,
    data.tokenId,
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
      tokenUpdate.name &&
      tokenUpdate.name.toLowerCase() !== token.name?.toLowerCase();

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
  const agentToken = await populateAssignedTags(
    updatedToken.workspaceId,
    updatedToken
  );

  return {
    token: await getPublicAgentToken(agentToken, data.shouldEncode ?? false),
  };
};

export default updateAgentTokenEndpoint;
