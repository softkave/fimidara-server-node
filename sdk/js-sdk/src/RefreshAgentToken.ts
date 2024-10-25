import assert from 'assert';
import {noop} from 'lodash-es';
import {RefreshableResource} from 'softkave-js-utils';
import {kDefaultRefreshTokenTimeoutLatency} from './constants.js';
import type {FimidaraEndpoints} from './endpoints/publicEndpoints.js';
import type {AgentToken} from './endpoints/publicTypes.js';

export type RefreshAgentTokenValue = Pick<
  AgentToken,
  'jwtTokenExpiresAt' | 'jwtToken' | 'refreshToken'
>;

export class RefreshAgentToken extends RefreshableResource<RefreshAgentTokenValue> {
  constructor(props: {
    token: RefreshAgentTokenValue;
    endpoints: FimidaraEndpoints;
    timeoutLatency?: number;
    onError?: (error: unknown, current: RefreshAgentTokenValue) => void;
  }) {
    super({
      timeout: props.token.jwtTokenExpiresAt
        ? props.token.jwtTokenExpiresAt -
          (props.timeoutLatency ?? kDefaultRefreshTokenTimeoutLatency)
        : 0,
      resource: props.token,
      refreshFn: async current => {
        assert.ok(current.refreshToken, 'No refresh token provided');

        const response = await props.endpoints.agentTokens.refreshToken(
          {refreshToken: current.refreshToken},
          {authToken: current.jwtToken}
        );

        return response;
      },
      onRefresh: resource => {
        this.setRefreshTimeout(
          props.token.jwtTokenExpiresAt
            ? props.token.jwtTokenExpiresAt -
                (props.timeoutLatency ?? kDefaultRefreshTokenTimeoutLatency)
            : 0
        ).start();
      },
      onError: (error, current) => {
        this.stop();
        (props.onError ?? noop)(error, current);
      },
    });
  }

  public start() {
    if (this.timeout) {
      return super.start();
    }

    return this;
  }

  public getJwtToken() {
    return this.getValue().jwtToken;
  }
}
