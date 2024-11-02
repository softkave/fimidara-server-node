import * as argon2 from 'argon2';
import {IServerRequest} from '../../../contexts/types.js';
import {PublicAgentToken} from '../../../definitions/agentToken.js';
import {
  BaseTokenData,
  kCurrentJWTTokenVersion,
} from '../../../definitions/system.js';
import {
  kPublicSessionAgent,
  kSystemSessionAgent,
} from '../../../utils/agent.js';

export type MockExpressRequestAgentTokenParam = Pick<
  PublicAgentToken,
  'resourceId' | 'createdAt' | 'expiresAt' | 'refreshToken'
>;

export function mockExpressRequest(token?: BaseTokenData) {
  const req: IServerRequest = {auth: token} as unknown as IServerRequest;
  return req;
}

export function mockExpressRequestWithAgentToken(
  token: MockExpressRequestAgentTokenParam
) {
  const req: IServerRequest = {
    auth:
      token.resourceId === kSystemSessionAgent.agentTokenId ||
      token.resourceId === kPublicSessionAgent.agentTokenId
        ? undefined
        : {
            version: kCurrentJWTTokenVersion,
            sub: {id: token.resourceId},
            iat: token.createdAt,
            exp: token.expiresAt,
          },
  } as unknown as IServerRequest;

  return req;
}

export async function mockExpressRequestWithAgentRefreshToken(
  token: MockExpressRequestAgentTokenParam
) {
  const req: IServerRequest = {
    auth:
      token.resourceId === kSystemSessionAgent.agentTokenId ||
      token.resourceId === kPublicSessionAgent.agentTokenId
        ? undefined
        : {
            version: kCurrentJWTTokenVersion,
            sub: {
              id: token.resourceId,
              refreshToken: token.refreshToken
                ? await argon2.hash(token.refreshToken)
                : undefined,
            },
            iat: token.createdAt,
            exp: token.expiresAt,
          },
  } as unknown as IServerRequest;

  return req;
}

export function mockExpressRequestForPublicAgent() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const req: IServerRequest = {};
  return req;
}
