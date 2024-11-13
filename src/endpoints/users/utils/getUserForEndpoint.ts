import {defaultTo, intersection} from 'lodash-es';
import {convertToArray, OrArray} from 'softkave-js-utils';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {
  FimidaraPermissionAction,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import {
  kTokenAccessScope,
  SessionAgent,
  TokenAccessScope,
} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {InvalidRequestError, NotFoundError} from '../../errors.js';

function checkIsPermittedScope(
  agent: SessionAgent,
  params: {scope?: OrArray<TokenAccessScope>}
) {
  return (
    intersection(
      convertToArray(defaultTo(params.scope, kTokenAccessScope.login)),
      agent.agentToken.scope
    ).length > 0
  );
}

export async function getUserByEmailOrSessionAgent(
  agent: SessionAgent,
  params: {
    email?: string;
    action?: FimidaraPermissionAction;
    scope?: OrArray<TokenAccessScope>;
    workspaceId: string;
  },
  opts: SemanticProviderMutationParams
) {
  const isPermittedScope = checkIsPermittedScope(agent, params);

  if (params.email) {
    if (params.email === agent.user?.email && isPermittedScope) {
      return agent.user;
    }

    const user = await kSemanticModels.user().getByEmail({
      email: params.email,
      workspaceId: params.workspaceId,
    });

    appAssert(user, new NotFoundError('User not found'));
    await checkAuthorizationWithAgent({
      agent,
      opts,
      workspaceId: params.workspaceId,
      target: {
        action: params.action || kFimidaraPermissionActions.readUser,
        targetId: user.resourceId,
      },
    });

    return user;
  } else if (isPermittedScope && agent.user) {
    return agent.user;
  }

  throw new InvalidRequestError('Email is required');
}

export async function getUserByUserIdOrSessionAgent(
  agent: SessionAgent,
  params: {
    userId?: string;
    action?: FimidaraPermissionAction;
    scope?: OrArray<TokenAccessScope>;
    workspaceId: string;
  },
  opts: SemanticProviderMutationParams
) {
  const isPermittedScope = checkIsPermittedScope(agent, params);

  if (params.userId) {
    if (params.userId === agent.user?.resourceId && isPermittedScope) {
      return agent.user;
    }

    const user = await kSemanticModels.user().getByUserId({
      userId: params.userId,
      workspaceId: params.workspaceId,
    });

    appAssert(user, new NotFoundError('User not found'));
    await checkAuthorizationWithAgent({
      agent,
      opts,
      workspaceId: params.workspaceId,
      target: {
        action: params.action || kFimidaraPermissionActions.readUser,
        targetId: user.resourceId,
      },
    });

    return user;
  } else if (isPermittedScope && agent.user) {
    return agent.user;
  }

  throw new InvalidRequestError('User ID is required');
}

export async function getUserForEndpoint(
  agent: SessionAgent,
  params: {
    email?: string;
    userId?: string;
    scope?: OrArray<TokenAccessScope>;
    action?: FimidaraPermissionAction;
    workspaceId: string;
  },
  opts: SemanticProviderMutationParams
) {
  if (params.email) {
    return getUserByEmailOrSessionAgent(agent, params, opts);
  } else if (params.userId) {
    return getUserByUserIdOrSessionAgent(agent, params, opts);
  }

  throw new InvalidRequestError('Email or user ID is required');
}
