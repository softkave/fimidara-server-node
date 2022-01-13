import * as jwt from 'jsonwebtoken';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {ISessionAgent, SessionAgentType} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import cast, {denull} from '../../utilities/fns';
import {
  wrapFireAndThrowError,
  wrapFireAndThrowErrorNoAsync,
} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';
import {InvalidRequestError} from '../errors';
import ProgramAccessTokenQueries from '../programAccessTokens/queries';
import EndpointReusableQueries from '../queries';
import RequestData from '../RequestData';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../user/errors';
import UserQueries from '../user/UserQueries';
import UserTokenQueries from '../user/UserTokenQueries';
import {IBaseContext} from './BaseContext';

// TODO: when retrieving cached tokens from the session agent,
// check that the token contains the input JWTEndpoints

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
  // aud: string[];
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
  ) => Promise<IUser>;
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
      permittedAgentTypes?: SessionAgentType[],
      audience?: TokenAudience | TokenAudience[]
    ) => {
      if (data.agent) {
        return data.agent;
      }

      let userToken: IUserToken | null = null;
      let user: IUser | null = null;
      let clientAssignedToken: IClientAssignedToken | null = null;
      let programAccessToken: IProgramAccessToken | null = null;
      const incomingTokenData = data.incomingTokenData;
      const noProcessedToken =
        !userToken && !clientAssignedToken && !programAccessToken;

      if (noProcessedToken) {
        if (!incomingTokenData) {
          throw new PermissionDeniedError();
        }

        switch (incomingTokenData.sub.type) {
          case TokenType.UserToken: {
            userToken = await ctx.data.userToken.assertGetItem(
              UserTokenQueries.getById(incomingTokenData.sub.id)
            );

            if (audience) {
              ctx.session.tokenContainsAudience(ctx, userToken, audience);
            }

            user = await ctx.data.user.assertGetItem(
              EndpointReusableQueries.getById(userToken.userId)
            );
            break;
          }

          case TokenType.ProgramAccessToken: {
            programAccessToken = await ctx.data.programAccessToken.assertGetItem(
              ProgramAccessTokenQueries.getById(incomingTokenData.sub.id)
            );
            break;
          }

          case TokenType.ClientAssignedToken: {
            clientAssignedToken = await ctx.data.clientAssignedToken.assertGetItem(
              EndpointReusableQueries.getById(incomingTokenData.sub.id)
            );
            break;
          }
        }
      }

      if (permittedAgentTypes) {
        const permittedAgent = permittedAgentTypes.find(type => {
          switch (type) {
            case SessionAgentType.User:
              return !!userToken;
            case SessionAgentType.ProgramAccessToken:
              return !!programAccessToken;
            case SessionAgentType.ClientAssignedToken:
              return !!clientAssignedToken;
          }
        });

        if (!permittedAgent) {
          throw new PermissionDeniedError();
        }
      }

      if (userToken) {
        const agent: ISessionAgent = {
          incomingTokenData,
          userToken,
          user: denull(user),
          agentId: userToken.userId,
          agentType: SessionAgentType.User,
          tokenId: userToken.resourceId,
          tokenType: TokenType.UserToken,
        };

        data.agent = agent;
        return agent;
      }

      if (programAccessToken) {
        const agent: ISessionAgent = {
          incomingTokenData,
          programAccessToken,
          agentId: programAccessToken.resourceId,
          agentType: SessionAgentType.ProgramAccessToken,
          tokenId: programAccessToken.resourceId,
          tokenType: TokenType.ProgramAccessToken,
        };

        data.agent = agent;
        return agent;
      }

      if (clientAssignedToken) {
        const agent: ISessionAgent = {
          incomingTokenData,
          clientAssignedToken,
          agentId: clientAssignedToken.resourceId,
          agentType: SessionAgentType.ClientAssignedToken,
          tokenId: clientAssignedToken.resourceId,
          tokenType: TokenType.ClientAssignedToken,
        };

        data.agent = agent;
        return agent;
      }

      // Throw error, control should not get here
      throw new InvalidCredentialsError();
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

      const user = await ctx.data.user.assertGetItem(
        UserQueries.getById(agent.agentId)
      );

      return user;
    }
  );

  decodeToken = wrapFireAndThrowErrorNoAsync(
    (ctx: IBaseContext, token: string) => {
      const tokenData = jwt.verify(
        token,
        ctx.appVariables.jwtSecret
      ) as IBaseTokenData<IGeneralTokenSubject>;

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

export function getOrganizationId(
  agent: ISessionAgent,
  providedOrganizationId?: string | null
) {
  const organizationId = agent.clientAssignedToken
    ? agent.clientAssignedToken.organizationId
    : agent.programAccessToken
    ? agent.programAccessToken.organizationId
    : providedOrganizationId;

  if (!organizationId) {
    throw new InvalidRequestError('Organization ID not provided');
  }

  return organizationId;
}

export function getClientAssignedTokenId(
  agent: ISessionAgent,
  providedTokenId?: string | null,
  onReferenced?: boolean
) {
  const tokenId = providedTokenId
    ? providedTokenId
    : onReferenced
    ? agent.clientAssignedToken?.resourceId
    : null;

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

export function updateReqAgent(
  reqData: RequestData,
  fn: (agent?: ISessionAgent) => ISessionAgent | undefined
) {
  if (reqData.agent) {
    reqData.agent = fn(reqData.agent);
  }
}
