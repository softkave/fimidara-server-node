import {omit} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {
  getActionAgentFromSessionAgent,
  tryGetAgentTokenId,
} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists.js';
import {
  assertAgentToken,
  checkAgentTokenAuthorization02,
  getPublicAgentToken,
} from '../utils.js';
import {UpdateAgentTokenEndpoint} from './types.js';
import {updateAgentTokenJoiSchema} from './validation.js';

const updateAgentToken: UpdateAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, updateAgentTokenJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    'updateAgentToken'
  );

  const updatedToken = await kIjxSemantic.utils().withTxn(async opts => {
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
        checkAgentTokenNameExists({
          workspaceId: token.workspaceId,
          name: tokenUpdate.name!,
          resourceId: token.resourceId,
          opts,
        }),
    ]);

    const updatedToken = await kIjxSemantic
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

export default updateAgentToken;
