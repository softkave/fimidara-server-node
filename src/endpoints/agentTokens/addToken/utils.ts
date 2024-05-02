import {defaultTo, omit} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  Agent,
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists.js';
import {NewAgentTokenInput} from './types.js';

export const INTERNAL_createAgentToken = async (
  agent: Agent,
  workspace: Workspace,
  data: NewAgentTokenInput,
  opts: SemanticProviderMutationParams
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
    kFimidaraResourceType.AgentToken,
    workspace.resourceId,
    {
      ...omit(data, 'tags'),
      providedResourceId: defaultTo(data.providedResourceId, null),
      version: kCurrentJWTTokenVersion,
      forEntityId: null,
      entityType: kFimidaraResourceType.AgentToken,
      scope: [kTokenAccessScope.access],
    }
  );
  await Promise.all([
    data.name && checkAgentTokenNameExists(workspace.resourceId, data.name, opts),
  ]);
  await kSemanticModels.agentToken().insertItem(token, opts);
  return token;
};
