import jwtpkg from 'jsonwebtoken';
import {first} from 'lodash-es';
import {AgentToken} from '../definitions/agentToken.js';
import {
  BaseTokenData,
  FimidaraResourceType,
  SessionAgent,
  TokenAccessScope,
  TokenSubjectDefault,
  kCurrentJWTTokenVersion,
  kFimidaraResourceType,
  kTokenAccessScope,
} from '../definitions/system.js';
import {User} from '../definitions/user.js';
import RequestData from '../endpoints/RequestData.js';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../endpoints/users/errors.js';
import {kPublicSessionAgent, kSystemSessionAgent} from '../utils/agent.js';
import {appAssert} from '../utils/assertion.js';
import {dateToSeconds} from '../utils/dateFns.js';
import {ServerError} from '../utils/errors.js';
import {cast, convertToArray} from '../utils/fns.js';
import {indexArray} from '../utils/indexArray.js';
import {kReuseableErrors} from '../utils/reusableErrors.js';
import {
  makeUserSessionAgent,
  makeWorkspaceAgentTokenAgent,
} from '../utils/sessionUtils.js';
import {kSemanticModels, kUtilsInjectables} from './injection/injectables.js';

export const kSessionUtils = {
  permittedAgentTypes: {
    user: [kFimidaraResourceType.User],
    api: [
      kFimidaraResourceType.User,
      kFimidaraResourceType.AgentToken,
      kFimidaraResourceType.Public,
    ],
  },
  accessScopes: {
    user: [kTokenAccessScope.login],
    changePassword: [kTokenAccessScope.changePassword],
    confirmEmailAddress: [kTokenAccessScope.confirmEmailAddress],
    api: [kTokenAccessScope.login, kTokenAccessScope.access],
  },
};

export interface SessionContextType {
  getAgentFromReq: (
    data: RequestData,
    permittedAgentTypes: FimidaraResourceType | FimidaraResourceType[],
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) => Promise<SessionAgent>;
  getAgentByAgentTokenId: (agentTokenId: string) => Promise<SessionAgent>;
  getUser: (
    data: RequestData,
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
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
  getAgentFromReq = async (
    data: RequestData,
    permittedAgentTypes: FimidaraResourceType | FimidaraResourceType[],
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) => {
    const incomingTokenData = data.incomingTokenData;
    let agent: SessionAgent | null | undefined = data.agent;

    if (!agent) {
      if (incomingTokenData) {
        const agentToken = await kSemanticModels
          .agentToken()
          .getOneById(incomingTokenData.sub.id);
        appAssert(agentToken, new InvalidCredentialsError());

        if (agentToken.entityType === kFimidaraResourceType.User) {
          appAssert(agentToken.forEntityId);
          const user = await kSemanticModels
            .user()
            .getOneById(agentToken.forEntityId);
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

  getAgentByAgentTokenId = async (
    agentTokenId: string
  ): Promise<SessionAgent> => {
    if (agentTokenId === kSystemSessionAgent.agentTokenId) {
      return kSystemSessionAgent;
    } else if (agentTokenId === kPublicSessionAgent.agentTokenId) {
      return kPublicSessionAgent;
    }

    const agentToken = await kSemanticModels
      .agentToken()
      .getOneById(agentTokenId);
    appAssert(agentToken, new InvalidCredentialsError());

    if (agentToken.entityType === kFimidaraResourceType.User) {
      appAssert(agentToken.forEntityId);
      const user = await kSemanticModels
        .user()
        .getOneById(agentToken.forEntityId);
      appAssert(user, kReuseableErrors.user.notFound());
      return makeUserSessionAgent(user, agentToken);
    } else {
      return makeWorkspaceAgentTokenAgent(agentToken);
    }
  };

  getUser = async (
    data: RequestData,
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) => {
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(data, [kFimidaraResourceType.User], tokenAccessScope);
    appAssert(agent.user, new ServerError());
    return agent.user;
  };

  decodeToken = (token: string) => {
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    appAssert(suppliedConfig.jwtSecret);

    const tokenData = cast<BaseTokenData<TokenSubjectDefault>>(
      jwtpkg.verify(token, suppliedConfig.jwtSecret, {complete: false})
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
    const expectedTokenScopesMap = indexArray(
      convertToArray(expectedTokenScopes),
      {
        reducer: () => true,
      }
    );
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
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    appAssert(suppliedConfig.jwtSecret);

    const payload: Omit<BaseTokenData, 'iat'> & {iat?: number} = {
      version: kCurrentJWTTokenVersion,
      sub: {id: tokenId},
    };

    if (expires) payload.exp = dateToSeconds(expires);
    if (issuedAt) payload.iat = dateToSeconds(issuedAt);

    return jwtpkg.sign(payload, suppliedConfig.jwtSecret);
  };

  private checkPermittedAgentTypes(
    agent: SessionAgent,
    permittedAgentTypes?: FimidaraResourceType | FimidaraResourceType[]
  ) {
    if (permittedAgentTypes?.length) {
      const permittedAgent = convertToArray(permittedAgentTypes).find(
        type => type === agent.agentType
      );

      if (!permittedAgent) throw new PermissionDeniedError();
    }
  }

  private checkAgentTokenAccessScope(
    agent: SessionAgent,
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) {
    const containsScope = kUtilsInjectables
      .session()
      .tokenContainsScope(agent.agentToken, tokenAccessScope);
    appAssert(
      containsScope,
      new PermissionDeniedError(),
      `${agent.agentType} with scopes [${agent.agentToken.scope}] does not contain [${tokenAccessScope}]`
    );
  }

  private checkRequiresPasswordChange(
    agent: SessionAgent,
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) {
    if (agent.agentType === kFimidaraResourceType.User) {
      appAssert(agent.user);
      if (agent.user.requiresPasswordChange) {
        const scopeList = convertToArray(tokenAccessScope);
        const agentToken = agent.agentToken;
        if (
          !agentToken ||
          !this.tokenContainsScope(
            agentToken,
            kTokenAccessScope.changePassword
          ) ||
          // Action must be strictly change password
          first(scopeList) !== kTokenAccessScope.changePassword ||
          scopeList.length > 1
        )
          throw kReuseableErrors.user.changePassword();
      }
    }
  }
}
