import {defaultTo, omit} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {AgentToken} from '../../../definitions/agentToken.js';
import {
  Agent,
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../../../definitions/system.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {checkAgentTokenNameExists} from '../checkAgentTokenNameExists.js';
import {kAgentTokenConstants} from '../constants.js';
import {NewAgentTokenInput} from './types.js';

export const INTERNAL_createAgentToken = async (
  agent: Agent,
  workspaceId: string,
  data: NewAgentTokenInput,
  opts: SemanticProviderMutationParams,
  seed?: Partial<AgentToken>
) => {
  let token: AgentToken | null = null;

  if (data.providedResourceId) {
    token = await kIjxSemantic
      .agentToken()
      .getByProvidedId(workspaceId, data.providedResourceId, opts);
  }

  if (token) {
    throw kReuseableErrors.agentToken.withProvidedIdExists(
      data.providedResourceId
    );
  }

  token = newWorkspaceResource<AgentToken>(
    agent,
    kFimidaraResourceType.AgentToken,
    workspaceId,
    /** seed */ {
      ...omit(data, 'tags'),
      providedResourceId: defaultTo(data.providedResourceId, null),
      version: kCurrentJWTTokenVersion,
      forEntityId: null,
      entityType: kFimidaraResourceType.AgentToken,
      scope: [kTokenAccessScope.access],
      shouldRefresh: data.shouldRefresh,
      refreshDuration:
        data.refreshDuration || kAgentTokenConstants.refreshDurationMs,
      ...(seed as AnyObject),
    }
  );

  await Promise.all([
    data.name &&
      checkAgentTokenNameExists({
        workspaceId,
        name: data.name,
        opts,
      }),
  ]);
  await kIjxSemantic.agentToken().insertItem(token, opts);

  return token;
};
