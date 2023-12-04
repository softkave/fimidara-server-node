export interface SecretsManagerProviderAddSecretParams {
  text: string;
  name: string;
}

export interface SecretsManagerProviderAddSecretResult {
  id: string;
}

export interface SecretsManagerProviderGetSecretParams {
  id: string;
}

export interface SecretsManagerProviderGetSecretResult {
  text: string;
}

export interface SecretsManagerProvider {
  addSecret: (
    params: SecretsManagerProviderAddSecretParams
  ) => Promise<SecretsManagerProviderAddSecretResult>;
  /** throws if secret is not found */
  getSecret: (
    params: SecretsManagerProviderGetSecretParams
  ) => Promise<SecretsManagerProviderGetSecretResult>;
}
