import * as jwt from 'jsonwebtoken';
import {AgentToken} from '../../definitions/agentToken';
import {
  AppResourceType,
  BaseTokenData,
  CURRENT_TOKEN_VERSION,
  SessionAgent,
  TokenAccessScope,
  TokenSubjectDefault,
} from '../../definitions/system';
import {User} from '../../definitions/user';
import {PUBLIC_SESSION_AGENT} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {dateToSeconds} from '../../utils/dateFns';
import {ServerError} from '../../utils/errors';
import {cast, toArray, toNonNullableArray} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {reuseableErrors} from '../../utils/reusableErrors';
import {makeUserSessionAgent, makeWorkspaceAgentTokenAgent} from '../../utils/sessionUtils';
import RequestData from '../RequestData';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../users/errors';
import {BaseContextType} from './types';

export interface SessionContextType {
  getAgent: (
    ctx: BaseContextType,
    data: RequestData,
    permittedAgentTypes?: AppResourceType | AppResourceType[],
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => Promise<SessionAgent>;
  getUser: (
    ctx: BaseContextType,
    data: RequestData,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => Promise<User>;
  decodeToken: (ctx: BaseContextType, token: string) => BaseTokenData<TokenSubjectDefault>;
  tokenContainsScope: (
    tokenData: AgentToken,
    expectedTokenScopes: TokenAccessScope | TokenAccessScope[]
  ) => boolean;
  encodeToken: (
    ctx: BaseContextType,
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => string;
}

export default class SessionContext implements SessionContextType {
  getAgent = async (
    ctx: BaseContextType,
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

    let user: User | null = null;
    const incomingTokenData = data.incomingTokenData;

    if (incomingTokenData) {
      const agentToken = await ctx.semantic.agentToken.getOneById(incomingTokenData.sub.id);
      appAssert(agentToken, new InvalidCredentialsError());

      if (agentToken.agentType === AppResourceType.User) {
        appAssert(agentToken.separateEntityId);
        user = await ctx.semantic.user.getOneById(agentToken.separateEntityId);
        appAssert(user, reuseableErrors.user.notFound());

        if (!ctx.session.tokenContainsScope(agentToken, tokenAccessScope)) {
          throw new PermissionDeniedError();
        }

        if (
          user.requiresPasswordChange &&
          !this.tokenContainsScope(agentToken, TokenAccessScope.ChangePassword)
        ) {
          throw reuseableErrors.user.changePassword();
        }
      }

      if (permittedAgentTypes?.length) {
        const permittedAgent = toNonNullableArray(permittedAgentTypes).find(
          type => type === agentToken.agentType
        );

        if (!permittedAgent) throw new PermissionDeniedError();
      }

      if (user) {
        return (data.agent = makeUserSessionAgent(user, agentToken));
      } else if (agentToken) {
        return (data.agent = makeWorkspaceAgentTokenAgent(agentToken));
      }
    }

    appAssert(permittedAgentTypes.includes(AppResourceType.Public), new PermissionDeniedError());
    return PUBLIC_SESSION_AGENT;
  };

  getUser = async (
    ctx: BaseContextType,
    data: RequestData,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => {
    const agent = await ctx.session.getAgent(ctx, data, [AppResourceType.User], tokenAccessScope);
    appAssert(agent.user, new ServerError());
    return agent.user;
  };

  decodeToken = (ctx: BaseContextType, token: string) => {
    const tokenData = cast<BaseTokenData<TokenSubjectDefault>>(
      jwt.verify(token, ctx.appVariables.jwtSecret, {
        complete: false,
      })
    );

    if (tokenData.version < CURRENT_TOKEN_VERSION) {
      throw new CredentialsExpiredError();
    }

    return tokenData;
  };

  tokenContainsScope = (
    tokenData: AgentToken,
    expectedTokenScopes: TokenAccessScope | TokenAccessScope[]
  ) => {
    const tokenScopes = tokenData.scope ?? [];
    const expectedTokenScopesMap = indexArray(toArray(expectedTokenScopes), {reducer: () => true});
    const hasTokenAccessScope = !!tokenScopes.find(nextScope => expectedTokenScopesMap[nextScope]);
    return hasTokenAccessScope;
  };

  encodeToken = (
    ctx: BaseContextType,
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => {
    const payload: Omit<BaseTokenData, 'iat'> & {iat?: number} = {
      version: CURRENT_TOKEN_VERSION,
      sub: {id: tokenId},
    };

    if (expires) payload.exp = dateToSeconds(expires);
    if (issuedAt) payload.iat = dateToSeconds(issuedAt);

    return jwt.sign(payload, ctx.appVariables.jwtSecret);
  };
}
