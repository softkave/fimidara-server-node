import {defaultTo, omit} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken';
import {
  Agent,
  AppActionType,
  AppResourceType,
  CURRENT_TOKEN_VERSION,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists';
import {checkAgentTokenAuthorization} from '../utils';
import {NewAgentTokenInput} from './types';

/**
 * Creates a new program access token. Does not check authorization.
 */
export const internalCreateAgentToken = async (
  context: BaseContextType,
  agent: Agent,
  workspace: Workspace,
  data: NewAgentTokenInput,
  opts: SemanticDataAccessProviderMutationRunOptions
) => {
  let token: AgentToken | null = null;

  if (data.providedResourceId) {
    token = await context.semantic.agentToken.getByProvidedId(
      workspace.resourceId,
      data.providedResourceId,
      opts
    );
  }

  if (token) {
    const tokenUpdate: Partial<AgentToken> = {
      ...omit(data, 'tags'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const isNameChanged = data.name && data.name.toLowerCase() !== token.name?.toLowerCase();
    await Promise.all([
      checkAgentTokenAuthorization(context, agent, token, AppActionType.Update),
      isNameChanged && checkAgentTokenNameExists(context, workspace.resourceId, data.name!, opts),
    ]);
    token = await context.semantic.agentToken.getAndUpdateOneById(
      token.resourceId,
      tokenUpdate,
      opts
    );
  } else {
    token = newWorkspaceResource<AgentToken>(
      agent,
      AppResourceType.AgentToken,
      workspace.resourceId,
      {
        ...omit(data, 'tags'),
        providedResourceId: defaultTo(data.providedResourceId, null),
        version: CURRENT_TOKEN_VERSION,
        separateEntityId: null,
        agentType: AppResourceType.AgentToken,
      }
    );
    await Promise.all([
      checkAuthorization({
        context,
        agent,
        workspaceId: workspace.resourceId,
        workspace: workspace,
        targets: {targetType: AppResourceType.AgentToken},
        action: AppActionType.Create,
      }),
      data.name && checkAgentTokenNameExists(context, workspace.resourceId, data.name, opts),
    ]);
    await Promise.all([
      context.semantic.agentToken.insertItem(token, opts),
      // saveResourceAssignedItems(
      //   context,
      //   agent,
      //   workspace,
      //   token.resourceId,
      //   data,
      //   /* deleteExisting */ token ? true : false,
      //   opts
      // ),
    ]);
  }

  return token;
};
