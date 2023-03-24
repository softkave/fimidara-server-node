import {omit} from 'lodash';
import {IAgentToken} from '../../../definitions/agentToken';
import {AppActionType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent, tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists';
import {assertAgentToken, checkAgentTokenAuthorization, getPublicAgentToken} from '../utils';
import {UpdateAgentTokenEndpoint} from './types';
import {updateAgentTokenJoiSchema} from './validation';

const updateAgentToken: UpdateAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const token = await MemStore.withTransaction(context, async transaction => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction};
    let token: IAgentToken | null = null;

    if (tokenId) {
      token = await context.semantic.agentToken.getOneById(tokenId, opts);
    } else if (data.providedResourceId) {
      token = await context.semantic.agentToken.getByProvidedId(
        workspace.resourceId,
        data.providedResourceId,
        opts
      );
    }

    assertAgentToken(token);
    const tokenUpdate: Partial<IAgentToken> = {
      ...omit(data, 'tags'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const isNameChanged =
      tokenUpdate.name && tokenUpdate.name.toLowerCase() !== token.name?.toLowerCase();

    await Promise.all([
      checkAgentTokenAuthorization(context, agent, token, AppActionType.Read),
      isNameChanged &&
        checkAgentTokenNameExists(context, workspace.resourceId, tokenUpdate.name!, opts),
    ]);

    [token] = await Promise.all([
      context.semantic.agentToken.getAndUpdateOneById(token.resourceId, tokenUpdate, opts),
      saveResourceAssignedItems(
        context,
        agent,
        workspace,
        token.resourceId,
        data.token,
        /* deleteExisting */ true,
        opts
      ),
    ]);

    return token;
  });

  appAssert(token.workspaceId);
  const agentToken = await populateAssignedTags(context, token.workspaceId, token);
  return {token: getPublicAgentToken(context, agentToken)};
};

export default updateAgentToken;
