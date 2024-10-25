import {noop} from 'lodash-es';
import {RefreshableResource} from 'softkave-js-utils';
import {kDefaultRefreshTokenTimeoutLatency} from './constants.js';
import type {FimidaraEndpoints} from './endpoints/privateEndpoints.js';
import type {LoginResult} from './endpoints/privateTypes.js';

export class RefreshUserToken extends RefreshableResource<LoginResult> {
  constructor(props: {
    user: LoginResult;
    endpoints: FimidaraEndpoints;
    timeoutLatency?: number;
    onError?: (error: unknown, current: LoginResult) => void;
  }) {
    super({
      timeout:
        props.user.jwtTokenExpiresAt -
        (props.timeoutLatency ?? kDefaultRefreshTokenTimeoutLatency),
      resource: props.user,
      refreshFn: async current => {
        const response = await props.endpoints.users.refreshToken(
          {refreshToken: current.refreshToken},
          {authToken: current.jwtToken}
        );

        return response;
      },
      onRefresh: resource => {
        this.setRefreshTimeout(
          resource.jwtTokenExpiresAt -
            (props.timeoutLatency ?? kDefaultRefreshTokenTimeoutLatency)
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
