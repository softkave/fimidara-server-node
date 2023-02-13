import * as jwt from 'jsonwebtoken';
import {ResourceWithPermissionGroupsAndTags} from '../../definitions/assignedItem';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  IAgent,
  IBaseTokenData,
  IGeneralTokenSubject,
  ISessionAgent,
  publicAgent,
  SessionAgentType,
  TokenAudience,
  TokenType,
} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {appAssert} from '../../utils/assertion';
import {ServerError} from '../../utils/errors';
import {cast} from '../../utils/fns';
import {populateAssignedPermissionGroupsAndTags, populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {InvalidRequestError} from '../errors';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {CredentialsExpiredError, PermissionDeniedError} from '../user/errors';
import UserTokenQueries from '../user/UserTokenQueries';
import {IBaseContext} from './types';

export interface ISessionContext {
  getAgent: (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes?: SessionAgentType[],
    audience?: TokenAudience | TokenAudience[]
  ) => Promise<ISessionAgent>;
  getUser: (
    ctx: IBaseContext,
    data: RequestData,
    audience?: TokenAudience | TokenAudience[]
  ) => Promise<IUserWithWorkspace>;
  decodeToken: (ctx: IBaseContext, token: string) => IBaseTokenData<IGeneralTokenSubject>;
  tokenContainsAudience: (
    ctx: IBaseContext,
    tokenData: IUserToken,
    expectedAudience: TokenAudience | TokenAudience[]
  ) => boolean;
  encodeToken: (
    ctx: IBaseContext,
    tokenId: string,
    tokenType: TokenType,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => string;
}

export default class SessionContext implements ISessionContext {
  getAgent = async (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes: SessionAgentType[] = [
      SessionAgentType.User,
      SessionAgentType.ClientAssignedToken,
      SessionAgentType.ProgramAccessToken,
    ],
    audience: TokenAudience | TokenAudience[] = TokenAudience.Login
  ) => {
    if (data.agent) {
      return data.agent;
    }

    let userToken: IUserToken | null = null;
    let user: IUserWithWorkspace | null = null;
    let clientAssignedToken: ResourceWithPermissionGroupsAndTags<IClientAssignedToken> | null = null;
    let programAccessToken: ResourceWithPermissionGroupsAndTags<IProgramAccessToken> | null = null;
    const incomingTokenData = data.incomingTokenData;

    switch (incomingTokenData?.sub.type) {
      case TokenType.UserToken: {
        userToken = await ctx.data.userToken.assertGetOneByQuery(UserTokenQueries.getById(incomingTokenData.sub.id));
        if (audience) {
          ctx.session.tokenContainsAudience(ctx, userToken, audience);
        }

        user = await populateUserWorkspaces(
          ctx,
          await ctx.data.user.assertGetOneByQuery(EndpointReusableQueries.getByResourceId(userToken.userId))
        );
        break;
      }

      case TokenType.ProgramAccessToken: {
        const pgt = await ctx.data.programAccessToken.assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(incomingTokenData.sub.id)
        );
        programAccessToken = await populateAssignedPermissionGroupsAndTags(
          ctx,
          pgt.workspaceId,
          pgt,
          AppResourceType.ProgramAccessToken
        );
        break;
      }

      case TokenType.ClientAssignedToken: {
        const clientToken = await ctx.data.clientAssignedToken.assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(incomingTokenData.sub.id)
        );
        clientAssignedToken = await populateAssignedPermissionGroupsAndTags(
          ctx,
          clientToken.workspaceId,
          clientToken,
          AppResourceType.ClientAssignedToken
        );
        break;
      }
    }

    if (permittedAgentTypes?.length) {
      const permittedAgent = permittedAgentTypes.find(type => {
        switch (type) {
          case SessionAgentType.User:
            return !!userToken;
          case SessionAgentType.ProgramAccessToken:
            return !!programAccessToken;
          case SessionAgentType.ClientAssignedToken:
            return !!clientAssignedToken;
          case SessionAgentType.Public:
            return true;
          default:
            return false;
        }
      });

      if (!permittedAgent) {
        throw new PermissionDeniedError();
      }
    }

    if (userToken) {
      appAssert(user, new ServerError());
      const agent: ISessionAgent = makeUserSessionAgent(userToken, user);
      data.agent = agent;
      return agent;
    } else if (programAccessToken) {
      const agent: ISessionAgent = makeProgramAccessTokenAgent(programAccessToken);
      data.agent = agent;
      return agent;
    } else if (clientAssignedToken) {
      const agent: ISessionAgent = makeClientAssignedTokenAgent(clientAssignedToken);
      data.agent = agent;
      return agent;
    }

    return makePublicSessionAgent();
  };

  getUser = async (ctx: IBaseContext, data: RequestData, audience?: TokenAudience | TokenAudience[]) => {
    const agent = await ctx.session.getAgent(ctx, data, [SessionAgentType.User], audience);
    appAssert(agent.user, new ServerError());
    return agent.user;
  };

  decodeToken = (ctx: IBaseContext, token: string) => {
    const tokenData = cast<IBaseTokenData<IGeneralTokenSubject>>(
      jwt.verify(token, ctx.appVariables.jwtSecret, {
        complete: false,
      })
    );

    if (tokenData.version < CURRENT_TOKEN_VERSION) {
      throw new CredentialsExpiredError();
    }

    return tokenData;
  };

  tokenContainsAudience = (
    ctx: IBaseContext,
    tokenData: IUserToken,
    expectedAudience: TokenAudience | TokenAudience[]
  ) => {
    const audience = cast<TokenAudience[]>(tokenData.audience);
    const hasAudience = !!audience.find(nextAud => expectedAudience.includes(nextAud));
    return hasAudience;
  };

  encodeToken = (
    ctx: IBaseContext,
    tokenId: string,
    tokenType: TokenType,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => {
    const payload: Omit<IBaseTokenData, 'iat'> & {iat?: number} = {
      version: CURRENT_TOKEN_VERSION,
      sub: {
        id: tokenId,
        type: tokenType,
      },
    };

    const msInSec = 1000;
    if (expires) {
      const expNumericDate = new Date(expires).getTime();
      payload.exp = expNumericDate / msInSec; // exp is in seconds
    }
    if (issuedAt) {
      const iatNumericDate = new Date(issuedAt).getTime();
      payload.iat = iatNumericDate / msInSec; // iat is in seconds
    }

    return jwt.sign(payload, ctx.appVariables.jwtSecret);
  };
}

export function makeClientAssignedTokenAgent(
  clientAssignedToken: ResourceWithPermissionGroupsAndTags<IClientAssignedToken>
): ISessionAgent {
  return {
    clientAssignedToken,
    agentId: clientAssignedToken.resourceId,
    agentType: SessionAgentType.ClientAssignedToken,
    tokenId: clientAssignedToken.resourceId,
    tokenType: TokenType.ClientAssignedToken,
  };
}

export function makeProgramAccessTokenAgent(
  programAccessToken: ResourceWithPermissionGroupsAndTags<IProgramAccessToken>
): ISessionAgent {
  return {
    programAccessToken,
    agentId: programAccessToken.resourceId,
    agentType: SessionAgentType.ProgramAccessToken,
    tokenId: programAccessToken.resourceId,
    tokenType: TokenType.ProgramAccessToken,
  };
}

export function makeUserSessionAgent(userToken: IUserToken, user: IUserWithWorkspace): ISessionAgent {
  return {
    userToken,
    user,
    agentId: userToken.userId,
    agentType: SessionAgentType.User,
    tokenId: userToken.resourceId,
    tokenType: TokenType.UserToken,
  };
}

export function makePublicSessionAgent(): ISessionAgent {
  return {
    ...publicAgent,
  };
}

export function getWorkspaceIdNoThrow(agent: ISessionAgent, providedWorkspaceId?: string) {
  const workspaceId = providedWorkspaceId
    ? providedWorkspaceId
    : agent.clientAssignedToken
    ? agent.clientAssignedToken.workspaceId
    : agent.programAccessToken
    ? agent.programAccessToken.workspaceId
    : undefined;

  return workspaceId;
}

export function getWorkspaceId(agent: ISessionAgent, providedWorkspaceId?: string) {
  const workspaceId = getWorkspaceIdNoThrow(agent, providedWorkspaceId);
  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }

  return workspaceId;
}

export function getClientAssignedTokenIdNoThrow(
  agent: ISessionAgent,
  inputTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = inputTokenId ? inputTokenId : onReferenced ? agent.clientAssignedToken?.resourceId : null;
  return tokenId;
}

export function getClientAssignedTokenId(agent: ISessionAgent, inputTokenId?: string | null, onReferenced?: boolean) {
  const tokenId = getClientAssignedTokenIdNoThrow(agent, inputTokenId, onReferenced);
  if (!tokenId) {
    throw new InvalidRequestError('Client assigned token ID not provided');
  }

  return tokenId;
}

export function getProgramAccessTokenId(agent: ISessionAgent, providedTokenId?: string | null, onReferenced?: boolean) {
  const tokenId = providedTokenId ? providedTokenId : onReferenced ? agent.programAccessToken?.resourceId : null;
  if (!tokenId) {
    throw new InvalidRequestError('Program access token ID not provided');
  }

  return tokenId;
}

export function assertIncomingToken(
  incomingTokenData: IBaseTokenData | undefined | null,
  type: TokenType
): incomingTokenData is IBaseTokenData {
  if (!incomingTokenData) {
    throw new PermissionDeniedError();
  }
  if (incomingTokenData.sub.type !== type) {
    throw new PermissionDeniedError();
  }

  return true;
}

export function assertGetWorkspaceIdFromAgent(agent: ISessionAgent) {
  const workspaceId = agent.clientAssignedToken
    ? agent.clientAssignedToken.workspaceId
    : agent.programAccessToken
    ? agent.programAccessToken.workspaceId
    : null;

  if (!workspaceId) {
    throw new InvalidRequestError('Workspace ID not provided');
  }

  return workspaceId;
}

export function getActionAgentFromSessionAgent(sessionAgent: ISessionAgent): IAgent {
  const agent = {
    agentId: sessionAgent.agentId,
    agentType: sessionAgent.agentType,
  };

  return agent;
}
