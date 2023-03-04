import {defaultTo, omit} from 'lodash';
import {IAgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  BasicCRUDActions,
  CURRENT_TOKEN_VERSION,
  IAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {newResource} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {checkAgentTokenNameExists} from '../checkProgramNameExists';
import {checkAgentTokenAuthorization} from '../utils';
import {INewAgentTokenInput} from './types';

/**
 * Creates a new program access token. Does not check authorization.
 */
export const internalCreateAgentToken = async (
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  data: INewAgentTokenInput
) => {
  let token: IAgentToken | null = null;

  if (data.providedResourceId) {
    token = await context.semantic.agentToken.getByProvidedId(
      workspace.resourceId,
      data.providedResourceId
    );
  }

  if (token) {
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
  } else {
    await checkAuthorization({
      context,
      agent,
      workspaceId: workspace.resourceId,
      targets: [{type: AppResourceType.AgentToken}],
      action: BasicCRUDActions.Create,
    });

    if (data.name) {
      await checkAgentTokenNameExists(context, workspace.resourceId, data.name);
    }

    token = newResource(agent, AppResourceType.AgentToken, {
      ...omit(data, 'tags'),
      providedResourceId: defaultTo(data.providedResourceId, null),
      version: CURRENT_TOKEN_VERSION,
      workspaceId: workspace.resourceId,
      separateEntityId: null,
      agentType: AppResourceType.AgentToken,
    });
    await context.semantic.agentToken.insertItem(token);
  }

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    data,
    /* deleteExisting */ token ? true : false
  );
  appAssert(token.workspaceId);
  const agentToken = await populateAssignedTags(context, token.workspaceId, token);
  return agentToken;
};
