import type {IRefreshAuthToken} from './types.js';

export type FimidaraJsConfigAuthToken = string | IRefreshAuthToken;

export interface FimidaraJsConfigOptions {
  authToken?: FimidaraJsConfigAuthToken;
  serverURL?: string;
}

export class FimidaraJsConfig {
  protected inheritors: FimidaraJsConfig[] = [];

  constructor(
    protected config: FimidaraJsConfigOptions = {},
    protected inheritConfigFrom?: FimidaraJsConfig
  ) {
    inheritConfigFrom?.registerSdkConfigInheritor(this);
  }

  setSdkAuthToken(token: FimidaraJsConfigAuthToken) {
    this.setSdkConfig({authToken: token});
  }

  setSdkConfig(update: Partial<FimidaraJsConfigOptions>) {
    this.config = {...this.config, ...update};
    this.fanoutSdkConfigUpdate(update);
  }

  getSdkConfig() {
    return this.config;
  }

  protected registerSdkConfigInheritor(inheritor: FimidaraJsConfig) {
    this.inheritors.push(inheritor);
  }

  protected fanoutSdkConfigUpdate(update: Partial<FimidaraJsConfigOptions>) {
    this.inheritors.forEach(inheritor => inheritor.setSdkConfig(update));
  }
}
