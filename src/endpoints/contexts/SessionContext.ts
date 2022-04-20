import assert = require('assert');
import * as jwt from 'jsonwebtoken';
import {ResourceWithPresetsAndTags} from '../../definitions/assignedItem';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {
  AppResourceType,
  ISessionAgent,
  publicAgent,
  SessionAgentType,
} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {ServerError} from '../../utilities/errors';
import cast from '../../utilities/fns';
import {
  wrapFireAndThrowError,
  wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {
  withAssignedPresetsAndTags,
  withUserWorkspaces,
} from '../assignedItems/getAssignedItems';
import {InvalidRequestError} from '../errors';
import ProgramAccessTokenQueries from '../programAccessTokens/queries';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {CredentialsExpiredError, PermissionDeniedError} from '../user/errors';
import UserTokenQueries from '../user/UserTokenQueries';
import {IBaseContext} from './BaseContext';

export const CURRENT_TOKEN_VERSION = 1;

export enum TokenType {
  UserToken = 'user',
  ProgramAccessToken = 'program',
  ClientAssignedToken = 'client',
}

export enum TokenAudience {
  Login = 'login',
  ChangePassword = 'change-password',
  ConfirmEmailAddress = 'confirm-email-address',
}

export interface IGeneralTokenSubject {
  id: string;
  type: TokenType;
}

export interface IBaseTokenData<
  Sub extends IGeneralTokenSubject = IGeneralTokenSubject
> {
  version: number;
  sub: Sub;
  iat: number;
  exp?: number;
}

export interface IAgentPersistedToken {
  audience: TokenAudience[];
}

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
  decodeToken: (
    ctx: IBaseContext,
    token: string
  ) => IBaseTokenData<IGeneralTokenSubject>;
  tokenContainsAudience: (
    ctx: IBaseContext,
    tokenData: IUserToken,
    expectedAudience: TokenAudience | TokenAudience[]
  ) => boolean;
  encodeToken: (
    ctx: IBaseContext,
    tokenId: string,
    tokenType: TokenType,
    expires?: number
  ) => string;
}

export default class SessionContext implements ISessionContext {
  getAgent = wrapFireAndThrowError(
    async (
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
      let clientAssignedToken: ResourceWithPresetsAndTags<IClientAssignedToken> | null =
        null;
      let programAccessToken: ResourceWithPresetsAndTags<IProgramAccessToken> | null =
        null;
      const incomingTokenData = data.incomingTokenData;

      switch (incomingTokenData?.sub.type) {
        case TokenType.UserToken: {
          userToken = await ctx.data.userToken.assertGetItem(
            UserTokenQueries.getById(incomingTokenData.sub.id)
          );

          if (audience) {
            ctx.session.tokenContainsAudience(ctx, userToken, audience);
          }

          user = await withUserWorkspaces(
            ctx,
            await ctx.data.user.assertGetItem(
              EndpointReusableQueries.getById(userToken.userId)
            )
          );
          break;
        }

        case TokenType.ProgramAccessToken: {
          const pgt = await ctx.data.programAccessToken.assertGetItem(
            ProgramAccessTokenQueries.getById(incomingTokenData.sub.id)
          );

          programAccessToken = await withAssignedPresetsAndTags(
            ctx,
            pgt.workspaceId,
            pgt,
            AppResourceType.ProgramAccessToken
          );
          break;
        }

        case TokenType.ClientAssignedToken: {
          const clt = await ctx.data.clientAssignedToken.assertGetItem(
            EndpointReusableQueries.getById(incomingTokenData.sub.id)
          );

          clientAssignedToken = await withAssignedPresetsAndTags(
            ctx,
            clt.workspaceId,
            clt,
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
        assert(user, new ServerError());
        const agent: ISessionAgent = makeUserSessionAgent(userToken, user);
        data.agent = agent;
        return agent;
      } else if (programAccessToken) {
        const agent: ISessionAgent =
          makeProgramAccessTokenAgent(programAccessToken);

        data.agent = agent;
        return agent;
      } else if (clientAssignedToken) {
        const agent: ISessionAgent =
          makeClientAssignedTokenAgent(clientAssignedToken);

        data.agent = agent;
        return agent;
      }

      return makePublicSessionAgent();
    }
  );

  getUser = wrapFireAndThrowError(
    async (
      ctx: IBaseContext,
      data: RequestData,
      audience?: TokenAudience | TokenAudience[]
    ) => {
      const agent = await ctx.session.getAgent(
        ctx,
        data,
        [SessionAgentType.User],
        audience
      );

      assert(agent.user, new ServerError());
      return agent.user;
    }
  );

  decodeToken = wrapFireAndThrowErrorNoAsync(
    (ctx: IBaseContext, token: string) => {
      const tokenData = cast<IBaseTokenData<IGeneralTokenSubject>>(
        jwt.verify(token, ctx.appVariables.jwtSecret, {
          complete: false,
        })
      );

      if (tokenData.version < CURRENT_TOKEN_VERSION) {
        throw new CredentialsExpiredError();
      }

      return tokenData;
    }
  );

  tokenContainsAudience = wrapFireAndThrowErrorNoAsync(
    (
      ctx: IBaseContext,
      tokenData: IUserToken,
      expectedAudience: TokenAudience | TokenAudience[]
    ) => {
      const audience = cast<TokenAudience[]>(tokenData.audience);
      const hasAudience = !!audience.find(nextAud =>
        expectedAudience.includes(nextAud)
      );

      return hasAudience;
    }
  );

  encodeToken = wrapFireAndThrowErrorNoAsync(
    (
      ctx: IBaseContext,
      tokenId: string,
      tokenType: TokenType,
      expires?: number
    ) => {
      const payload: Omit<IBaseTokenData, 'iat'> = {
        version: CURRENT_TOKEN_VERSION,
        sub: {
          id: tokenId,
          type: tokenType,
        },
      };

      if (expires) {
        payload.exp = expires / 1000; // exp is in seconds
      }

      return jwt.sign(payload, ctx.appVariables.jwtSecret);
    }
  );
}

export const getSessionContext = singletonFunc(() => new SessionContext());

export function makeClientAssignedTokenAgent(
  clientAssignedToken: ResourceWithPresetsAndTags<IClientAssignedToken>
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
  programAccessToken: ResourceWithPresetsAndTags<IProgramAccessToken>
): ISessionAgent {
  return {
    programAccessToken,
    agentId: programAccessToken.resourceId,
    agentType: SessionAgentType.ProgramAccessToken,
    tokenId: programAccessToken.resourceId,
    tokenType: TokenType.ProgramAccessToken,
  };
}

export function makeUserSessionAgent(
  userToken: IUserToken,
  user: IUserWithWorkspace
): ISessionAgent {
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

export function getWorkspaceIdNoThrow(
  agent: ISessionAgent,
  providedWorkspaceId?: string
) {
  const workspaceId = agent.clientAssignedToken
    ? agent.clientAssignedToken.workspaceId
    : agent.programAccessToken
    ? agent.programAccessToken.workspaceId
    : providedWorkspaceId;

  return workspaceId;
}

export function getWorkspaceId(
  agent: ISessionAgent,
  providedWorkspaceId?: string
) {
  const workspaceId = getClientAssignedTokenIdNoThrow(
    agent,
    providedWorkspaceId
  );

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
  const tokenId = inputTokenId
    ? inputTokenId
    : onReferenced
    ? agent.clientAssignedToken?.resourceId
    : null;

  return tokenId;
}

export function getClientAssignedTokenId(
  agent: ISessionAgent,
  inputTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = getClientAssignedTokenIdNoThrow(
    agent,
    inputTokenId,
    onReferenced
  );

  if (!tokenId) {
    throw new InvalidRequestError('Client assigned token ID not provided');
  }

  return tokenId;
}

export function getProgramAccessTokenId(
  agent: ISessionAgent,
  providedTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = providedTokenId
    ? providedTokenId
    : onReferenced
    ? agent.programAccessToken?.resourceId
    : null;

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
