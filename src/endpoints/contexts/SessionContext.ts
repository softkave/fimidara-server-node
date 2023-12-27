import * as jwt from 'jsonwebtoken';
import {first} from 'lodash';
import {AgentToken} from '../../definitions/agentToken';
import {
  AppResourceType,
  BaseTokenData,
  SessionAgent,
  TokenAccessScope,
  TokenSubjectDefault,
  kAppResourceType,
  kCurrentJWTTokenVersion,
  kTokenAccessScope,
} from '../../definitions/system';
import {User} from '../../definitions/user';
import {kPublicSessionAgent} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {dateToSeconds} from '../../utils/dateFns';
import {ServerError} from '../../utils/errors';
import {cast, toArray} from '../../utils/fns';
import {indexArray} from '../../utils/indexArray';
import {kReuseableErrors} from '../../utils/reusableErrors';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../../utils/sessionUtils';
import RequestData from '../RequestData';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../users/errors';
import {kSemanticModels, kUtilsInjectables} from './injectables';

export interface SessionContextType {
  getAgent: (
    data: RequestData,
    permittedAgentTypes?: AppResourceType | AppResourceType[],
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => Promise<SessionAgent>;
  getAgentById: (id: string) => Promise<SessionAgent>;
  getUser: (
    data: RequestData,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => Promise<User>;
  decodeToken: (token: string) => BaseTokenData<TokenSubjectDefault>;
  tokenContainsScope: (
    tokenData: AgentToken,
    expectedTokenScopes: TokenAccessScope | TokenAccessScope[]
  ) => boolean;
  encodeToken: (
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => string;
}

export default class SessionContext implements SessionContextType {
  getAgent = async (
    data: RequestData,
    permittedAgentTypes: AppResourceType | AppResourceType[] = [
      kAppResourceType.User,
      kAppResourceType.AgentToken,
    ],
    tokenAccessScope: TokenAccessScope | TokenAccessScope[] = kTokenAccessScope.Login
  ) => {
    const incomingTokenData = data.incomingTokenData;
    let agent: SessionAgent | null | undefined = data.agent;

    if (!agent) {
      if (incomingTokenData) {
        const agentToken = await kSemanticModels
          .agentToken()
          .getOneById(incomingTokenData.sub.id);
        appAssert(agentToken, new InvalidCredentialsError());

        if (agentToken.entityType === kAppResourceType.User) {
          appAssert(agentToken.forEntityId);
          const user = await kSemanticModels.user().getOneById(agentToken.forEntityId);
          appAssert(user, kReuseableErrors.user.notFound());
          agent = makeUserSessionAgent(user, agentToken);
        } else {
          agent = makeWorkspaceAgentTokenAgent(agentToken);
        }
      } else {
        agent = kPublicSessionAgent;
      }
    }

    this.checkPermittedAgentTypes(agent, permittedAgentTypes);
    this.checkAgentTokenAccessScope(agent, tokenAccessScope);
    this.checkRequiresPasswordChange(agent, tokenAccessScope);

    return agent;
  };

  getUser = async (
    data: RequestData,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) => {
    const agent = await kUtilsInjectables
      .session()
      .getAgent(data, [kAppResourceType.User], tokenAccessScope);
    appAssert(agent.user, new ServerError());
    return agent.user;
  };

  decodeToken = (token: string) => {
    const tokenData = cast<BaseTokenData<TokenSubjectDefault>>(
      jwt.verify(token, kUtilsInjectables.config().jwtSecret, {
        complete: false,
      })
    );

    if (tokenData.version < kCurrentJWTTokenVersion) {
      throw new CredentialsExpiredError();
    }

    return tokenData;
  };

  tokenContainsScope = (
    tokenData: AgentToken,
    expectedTokenScopes: TokenAccessScope | TokenAccessScope[]
  ) => {
    const tokenScopes = tokenData.scope ?? [];
    const expectedTokenScopesMap = indexArray(toArray(expectedTokenScopes), {
      reducer: () => true,
    });
    const hasTokenAccessScope = !!tokenScopes.find(
      nextScope => expectedTokenScopesMap[nextScope]
    );
    return hasTokenAccessScope;
  };

  encodeToken = (
    tokenId: string,
    expires?: string | Date | number | null,
    issuedAt?: string | Date | number | null
  ) => {
    const payload: Omit<BaseTokenData, 'iat'> & {iat?: number} = {
      version: kCurrentJWTTokenVersion,
      sub: {id: tokenId},
    };

    if (expires) payload.exp = dateToSeconds(expires);
    if (issuedAt) payload.iat = dateToSeconds(issuedAt);

    return jwt.sign(payload, kUtilsInjectables.config().jwtSecret);
  };

  private checkPermittedAgentTypes(
    agent: SessionAgent,
    permittedAgentTypes?: AppResourceType | AppResourceType[]
  ) {
    if (permittedAgentTypes?.length) {
      const permittedAgent = toArray(permittedAgentTypes).find(
        type => type === agent.agentType
      );

      if (!permittedAgent) throw new PermissionDeniedError();
    }
  }

  private checkAgentTokenAccessScope(
    agent: SessionAgent,
    tokenAccessScope?: TokenAccessScope | TokenAccessScope[]
  ) {
    if (
      tokenAccessScope &&
      agent.agentType === kAppResourceType.User &&
      agent.agentToken
    ) {
      if (
        !kUtilsInjectables
          .session()
          .tokenContainsScope(agent.agentToken, tokenAccessScope)
      )
        throw new PermissionDeniedError();
    }
  }

  private checkRequiresPasswordChange(
    agent: SessionAgent,
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) {
    if (agent.agentType === kAppResourceType.User) {
      appAssert(agent.user);
      if (agent.user.requiresPasswordChange) {
        const scopeList = toArray(tokenAccessScope);
        const agentToken = agent.agentToken;
        if (
          !agentToken ||
          !this.tokenContainsScope(agentToken, kTokenAccessScope.ChangePassword) ||
          // Action must be strictly change password
          first(scopeList) !== kTokenAccessScope.ChangePassword ||
          scopeList.length > 1
        )
          throw kReuseableErrors.user.changePassword();
      }
    }
  }
}
