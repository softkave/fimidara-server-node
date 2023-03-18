import {defaultTo, omit} from 'lodash';
import {IAgentToken} from '../../../definitions/agentToken';
import {
  AppResourceType,
  BasicCRUDActions,
  CURRENT_TOKEN_VERSION,
  IAgent,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IBaseContext} from '../../contexts/types';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists';
import {checkAgentTokenAuthorization} from '../utils';
import {INewAgentTokenInput} from './types';

/**
 * Creates a new program access token. Does not check authorization.
 */
export const internalCreateAgentToken = async (
  context: IBaseContext,
  agent: IAgent,
  workspace: IWorkspace,
  data: INewAgentTokenInput,
  opts: ISemanticDataAccessProviderMutationRunOptions
) => {
  let token: IAgentToken | null = null;

  if (data.providedResourceId) {
    token = await context.semantic.agentToken.getByProvidedId(
      workspace.resourceId,
      data.providedResourceId,
      opts
    );
  }

  if (token) {
    const tokenUpdate: Partial<IAgentToken> = {
      ...omit(data, 'tags'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const isNameChanged = data.name && data.name.toLowerCase() !== token.name?.toLowerCase();
    await Promise.all([
      checkAgentTokenAuthorization(context, agent, token, BasicCRUDActions.Update),
      isNameChanged && checkAgentTokenNameExists(context, workspace.resourceId, data.name!, opts),
    ]);
    token = await context.semantic.agentToken.getAndUpdateOneById(
      token.resourceId,
      tokenUpdate,
      opts
    );
  } else {
    token = newWorkspaceResource(agent, AppResourceType.AgentToken, workspace.resourceId, {
      ...omit(data, 'tags'),
      providedResourceId: defaultTo(data.providedResourceId, null),
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: null,
      agentType: AppResourceType.AgentToken,
    });
    await Promise.all([
      checkAuthorization({
        context,
        agent,
        workspaceId: workspace.resourceId,
        targets: [{type: AppResourceType.AgentToken}],
        action: BasicCRUDActions.Create,
      }),
      data.name && checkAgentTokenNameExists(context, workspace.resourceId, data.name, opts),
    ]);
    await Promise.all([
      context.semantic.agentToken.insertItem(token, opts),
      saveResourceAssignedItems(
        context,
        agent,
        workspace,
        token.resourceId,
        data,
        /* deleteExisting */ token ? true : false,
        opts
      ),
    ]);
  }

  return token;
};
