import {defaultTo, omit} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken';
import {
  Agent,
  AppResourceTypeMap,
  CURRENT_TOKEN_VERSION,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kSemanticModels} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists';
import {NewAgentTokenInput} from './types';

export const INTERNAL_createAgentToken = async (
  agent: Agent,
  workspace: Workspace,
  data: NewAgentTokenInput,
  opts: SemanticProviderMutationRunOptions
) => {
  let token: AgentToken | null = null;

  if (data.providedResourceId) {
    token = await kSemanticModels
      .agentToken()
      .getByProvidedId(workspace.resourceId, data.providedResourceId, opts);
  }

  if (token) {
    throw kReuseableErrors.agentToken.withProvidedIdExists(data.providedResourceId);
  }

  token = newWorkspaceResource<AgentToken>(
    agent,
    AppResourceTypeMap.AgentToken,
    workspace.resourceId,
    {
      ...omit(data, 'tags'),
      providedResourceId: defaultTo(data.providedResourceId, null),
      version: CURRENT_TOKEN_VERSION,
      separateEntityId: null,
      agentType: AppResourceTypeMap.AgentToken,
    }
  );
  await Promise.all([
    data.name && checkAgentTokenNameExists(workspace.resourceId, data.name, opts),
  ]);
  await kSemanticModels.agentToken().insertItem(token, opts);
  return token;
};
