import * as jwt from 'jsonwebtoken';
import {IAgentToken} from '../../definitions/agentToken';
import {
  AppResourceType,
  CURRENT_TOKEN_VERSION,
  IBaseTokenData,
  ISessionAgent,
  ITokenSubjectDefault,
  PUBLIC_SESSION_AGENT,
  TokenAccessScope,
} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {appAssert} from '../../utils/assertion';
import {dateToSeconds} from '../../utils/dateFns';
import {ServerError} from '../../utils/errors';
import {cast, toArray} from '../../utils/fns';
import {reuseableErrors} from '../../utils/reusableErrors';
import {makeAgentTokenAgent, makeUserSessionAgent} from '../../utils/sessionUtils';
import RequestData from '../RequestData';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../user/errors';
import {IBaseContext} from './types';

export interface ISessionContext {
  getAgent: (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes?: AppResourceType | AppResourceType[],
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => Promise<ISessionAgent>;
  getUser: (
    ctx: IBaseContext,
    data: RequestData,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => Promise<IUser>;
  decodeToken: (ctx: IBaseContext, token: string) => IBaseTokenData<ITokenSubjectDefault>;
  tokenContainsTokenAccessScope: (
    ctx: IBaseContext,
    tokenData: IAgentToken,
    expectedTokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) => boolean;
  encodeToken: (
    ctx: IBaseContext,
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => string;
}

export default class SessionContext implements ISessionContext {
  getAgent = async (
    ctx: IBaseContext,
    data: RequestData,
    permittedAgentTypes: AppResourceType | AppResourceType[] = [
      AppResourceType.User,
      AppResourceType.AgentToken,
    ],
    tokenAccessScope: TokenAccessScope | TokenAccessScope[] = TokenAccessScope.Login
  ) => {
    if (data.agent) {
      return data.agent;
    }

    let user: IUser | null = null;
    const incomingTokenData = data.incomingTokenData;
    appAssert(incomingTokenData, new PermissionDeniedError());
    const agentToken = await ctx.semantic.agentToken.getOneById(incomingTokenData.sub.id);
    appAssert(agentToken, new InvalidCredentialsError());

    if (agentToken.agentType === AppResourceType.User) {
      appAssert(agentToken.separateEntityId);
      user = await ctx.semantic.user.getOneById(agentToken.separateEntityId);
      appAssert(user, reuseableErrors.user.notFound());
    }

    if (permittedAgentTypes?.length) {
      const permittedAgent = toArray(permittedAgentTypes).find(
        type => type === agentToken.agentType
      );

      if (!permittedAgent) {
        throw new PermissionDeniedError();
      }
    }

    if (tokenAccessScope) {
      ctx.session.tokenContainsTokenAccessScope(ctx, agentToken, tokenAccessScope);
    }

    if (user) {
      appAssert(user, new ServerError());
      return (data.agent = makeUserSessionAgent(user, agentToken));
    } else if (agentToken) {
      return (data.agent = makeAgentTokenAgent(agentToken));
    }

    return PUBLIC_SESSION_AGENT;
  };

  getUser = async (
    ctx: IBaseContext,
    data: RequestData,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => {
    const agent = await ctx.session.getAgent(ctx, data, [AppResourceType.User], tokenAccessScope);
    appAssert(agent.user, new ServerError());
    return agent.user;
  };

  decodeToken = (ctx: IBaseContext, token: string) => {
    const tokenData = cast<IBaseTokenData<ITokenSubjectDefault>>(
      jwt.verify(token, ctx.appVariables.jwtSecret, {
        complete: false,
      })
    );

    if (tokenData.version < CURRENT_TOKEN_VERSION) {
      throw new CredentialsExpiredError();
    }

    return tokenData;
  };

  tokenContainsTokenAccessScope = (
    ctx: IBaseContext,
    tokenData: IAgentToken,
    expectedTokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) => {
    const tokenAccessScope = cast<TokenAccessScope[]>(tokenData.scope);
    const hasTokenAccessScope = !!tokenAccessScope.find(nextAud =>
      expectedTokenAccessScope.includes(nextAud)
    );
    return hasTokenAccessScope;
  };

  encodeToken = (
    ctx: IBaseContext,
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => {
    const payload: Omit<IBaseTokenData, 'iat'> & {iat?: number} = {
      version: CURRENT_TOKEN_VERSION,
      sub: {id: tokenId},
    };

    const msInSec = 1000;
    if (expires) {
      payload.exp = dateToSeconds(expires);
    }
    if (issuedAt) {
      payload.iat = dateToSeconds(issuedAt);
    }

    return jwt.sign(payload, ctx.appVariables.jwtSecret);
  };
}
