import {omit} from 'lodash';
import {IAgentToken} from '../../../definitions/agentToken';
import {BasicCRUDActions} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent, tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {checkAgentTokenNameExists} from '../checkProgramNameExists';
import {assertAgentToken, checkAgentTokenAuthorization, getPublicAgentToken} from '../utils';
import {UpdateAgentTokenEndpoint} from './types';
import {updateAgentTokenJoiSchema} from './validation';

const updateAgentToken: UpdateAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  let token: IAgentToken | null = null;

  if (tokenId) {
    token = await context.semantic.agentToken.getOneById(tokenId);
  } else if (data.providedResourceId) {
    token = await context.semantic.agentToken.getByProvidedId(
      workspace.resourceId,
      data.providedResourceId
    );
  }

  assertAgentToken(token);
  await checkAgentTokenAuthorization(context, agent, token, BasicCRUDActions.Read);
  const tokenUpdate: Partial<IAgentToken> = {
    ...omit(data, 'tags'),
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  if (tokenUpdate.name && tokenUpdate.name.toLowerCase() !== token.name?.toLowerCase()) {
    await checkAgentTokenNameExists(context, workspace.resourceId, tokenUpdate.name);
  }

  token = await context.semantic.agentToken.getAndUpdateOneById(token.resourceId, tokenUpdate);
  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    data.token,
    /* deleteExisting */ true
  );
  appAssert(token.workspaceId);
  const agentToken = await populateAssignedTags(context, token.workspaceId, token);
  return {
    token: getPublicAgentToken(context, agentToken),
  };
};

export default updateAgentToken;
