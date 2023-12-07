export interface SecretsManagerProviderAddSecretParams {
  text: string;
  name: string;
}

export interface SecretsManagerProviderUpdateSecretParams {
  secretId: string;
  text: string;
  name: string;
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

export interface SecretsManagerProvider {
  addSecret: (
    params: SecretsManagerProviderAddSecretParams
  ) => Promise<SecretsManagerProviderAddSecretResult>;
  updateSecret: (
    params: SecretsManagerProviderUpdateSecretParams
  ) => Promise<SecretsManagerProviderAddSecretResult>;
  /** throws if secret is not found */
  getSecret: (
    params: SecretsManagerProviderGetSecretParams
  ) => Promise<SecretsManagerProviderGetSecretResult>;
}
