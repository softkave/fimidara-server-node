import {DisposableResource} from 'softkave-js-utils';

export interface SecretsManagerProviderAddSecretParams {
  text: string;
  name: string;
}

export interface SecretsManagerProviderUpdateSecretParams {
  secretId: string;
  text: string;
  name: string;
}

export interface SecretsManagerProviderDeleteSecretParams {
  secretId: string;
}

export interface SecretsManagerProviderAddSecretResult {
  secretId: string;
}

export interface SecretsManagerProviderGetSecretParams {
  secretId: string;
}

export interface SecretsManagerProviderGetSecretResult {
  text: string;
}

export interface SecretsManagerProvider extends DisposableResource {
  addSecret: (
    params: SecretsManagerProviderAddSecretParams
  ) => Promise<SecretsManagerProviderAddSecretResult>;
  updateSecret: (
    params: SecretsManagerProviderUpdateSecretParams
  ) => Promise<SecretsManagerProviderAddSecretResult>;
  deleteSecret: (
    params: SecretsManagerProviderDeleteSecretParams
  ) => Promise<void>;
  /** throws if secret is not found */
  getSecret: (
    params: SecretsManagerProviderGetSecretParams
  ) => Promise<SecretsManagerProviderGetSecretResult>;
}
