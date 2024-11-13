import * as argon2 from 'argon2';
import {millisecondsToSeconds} from 'date-fns';
import jwtpkg from 'jsonwebtoken';
import {first} from 'lodash-es';
import {getNewId} from 'softkave-js-utils';
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
import RequestData from '../endpoints/RequestData.js';
import {
  CredentialsExpiredError,
  InvalidCredentialsError,
  PermissionDeniedError,
} from '../endpoints/users/errors.js';
import {kPublicSessionAgent, kSystemSessionAgent} from '../utils/agent.js';
import {appAssert} from '../utils/assertion.js';
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
  permittedAgentType: {
    user: [kFimidaraResourceType.User],
    api: [
      kFimidaraResourceType.User,
      kFimidaraResourceType.AgentToken,
      kFimidaraResourceType.Public,
    ],
  },
  accessScope: {
    user: [kTokenAccessScope.login],
    api: [kTokenAccessScope.login, kTokenAccessScope.access],
  },
};

export interface ISessionContextEncodeTokenParams {
  tokenId: string;
  shouldRefresh?: boolean;
  expiresAt?: string | Date | number | null;
  issuedAt?: string | Date | number;
}

export interface ISessionContextEncodeTokenResult {
  refreshToken?: string;
  jwtToken: string;
  jwtTokenExpiresAt?: number;
}

export interface SessionContextType {
  getAgentFromReq: (
    data: RequestData,
    permittedAgentTypes: FimidaraResourceType | FimidaraResourceType[],
    tokenAccessScope: TokenAccessScope | TokenAccessScope[]
  ) => Promise<SessionAgent>;
  getAgentByAgentTokenId: (agentTokenId: string) => Promise<SessionAgent>;
  decodeToken: (token: string) => BaseTokenData<TokenSubjectDefault>;
  tokenContainsScope: (
    tokenData: AgentToken,
    expectedTokenScopes: TokenAccessScope | TokenAccessScope[]
  ) => boolean;
  encodeToken: (
    props: ISessionContextEncodeTokenParams
  ) => Promise<ISessionContextEncodeTokenResult>;
  verifyRefreshToken: (refreshToken: string, hash: string) => Promise<boolean>;
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
        this.checkTokenDataVersion(incomingTokenData);

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

  decodeToken = (token: string) => {
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    appAssert(suppliedConfig.jwtSecret);

    const tokenData = cast<BaseTokenData<TokenSubjectDefault>>(
      jwtpkg.verify(token, suppliedConfig.jwtSecret, {complete: false})
    );

    this.checkTokenDataVersion(tokenData);
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

  encodeToken = async (props: ISessionContextEncodeTokenParams) => {
    const {tokenId, shouldRefresh, expiresAt, issuedAt} = props;

    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    appAssert(suppliedConfig.jwtSecret);

    const payload: Omit<BaseTokenData, 'iat'> & {iat?: number} = {
      version: kCurrentJWTTokenVersion,
      sub: {id: tokenId},
    };
    const expiresAtMs = expiresAt ? new Date(expiresAt).valueOf() : undefined;
    const issuedAtMs = issuedAt ? new Date(issuedAt).valueOf() : undefined;
    let refreshToken: string | undefined;

    if (expiresAtMs) payload.exp = millisecondsToSeconds(expiresAtMs);
    if (issuedAtMs) payload.iat = millisecondsToSeconds(issuedAtMs);
    if (shouldRefresh) {
      appAssert(payload.exp, new ServerError(), 'expires must be set');
      refreshToken = getNewId();

      // TODO: check which is better, to hash or store in DB
      const hash = await argon2.hash(refreshToken);
      payload.sub.refreshToken = hash;
    }

    const jwtToken = jwtpkg.sign(payload, suppliedConfig.jwtSecret);

    return {
      jwtToken,
      refreshToken,
      jwtTokenExpiresAt: expiresAtMs,
    };
  };

  verifyRefreshToken = async (refreshToken: string, hash: string) => {
    return await argon2.verify(hash, refreshToken);
  };

  checkTokenDataVersion(tokenData: BaseTokenData) {
    if (tokenData.version < kCurrentJWTTokenVersion) {
      throw new CredentialsExpiredError();
    }
  }

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
