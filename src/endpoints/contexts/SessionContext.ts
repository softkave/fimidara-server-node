import * as jwt from 'jsonwebtoken';
import {first} from 'lodash';
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
import {cast, toArray} from '../../utils/fns';
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
    const incomingTokenData = data.incomingTokenData;
    let agent: SessionAgent | null | undefined = data.agent;

    if (!agent) {
      if (incomingTokenData) {
        const agentToken = await ctx.semantic.agentToken.getOneById(incomingTokenData.sub.id);
        appAssert(agentToken, new InvalidCredentialsError());

        if (agentToken.agentType === AppResourceType.User) {
          appAssert(agentToken.separateEntityId);
          const user = await ctx.semantic.user.getOneById(agentToken.separateEntityId);
          appAssert(user, reuseableErrors.user.notFound());
          agent = makeUserSessionAgent(user, agentToken);
        } else {
          agent = makeWorkspaceAgentTokenAgent(agentToken);
        }
      } else {
        agent = PUBLIC_SESSION_AGENT;
      }
    }

    this.checkPermittedAgentTypes(agent, permittedAgentTypes);
    this.checkAgentTokenAccessScope(ctx, agent, tokenAccessScope);
    this.checkRequiresPasswordChange(agent, tokenAccessScope);

    return agent;
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

  private checkPermittedAgentTypes(
    agent: SessionAgent,
    permittedAgentTypes?: AppResourceType | AppResourceType[]
  ) {
    if (permittedAgentTypes?.length) {
      const permittedAgent = toArray(permittedAgentTypes).find(type => type === agent.agentType);

      if (!permittedAgent) throw new PermissionDeniedError();
    }
  }

  private checkAgentTokenAccessScope(
    ctx: BaseContextType,
    agent: SessionAgent,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) {
    if (tokenAccessScope && agent.agentType === AppResourceType.User && agent.agentToken) {
      if (!ctx.session.tokenContainsScope(agent.agentToken, tokenAccessScope))
        throw new PermissionDeniedError();
    }
  }

  private checkRequiresPasswordChange(
    agent: SessionAgent,
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) {
    if (agent.agentType === AppResourceType.User) {
      appAssert(agent.user);
      if (agent.user.requiresPasswordChange) {
        const scopeList = toArray(tokenAccessScope);
        const agentToken = agent.agentToken;
        if (
          !agentToken ||
          !this.tokenContainsScope(agentToken, TokenAccessScope.ChangePassword) ||
          // Action must be strictly change password
          first(scopeList) !== TokenAccessScope.ChangePassword ||
          scopeList.length > 1
        )
          throw reuseableErrors.user.changePassword();
      }
    }
  }
}
