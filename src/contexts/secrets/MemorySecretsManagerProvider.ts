import {noop} from 'lodash-es';
import {appAssert} from '../../utils/assertion.js';
import {getNewId} from '../../utils/resource.js';
import {
  SecretsManagerProvider,
  SecretsManagerProviderAddSecretParams,
  SecretsManagerProviderAddSecretResult,
  SecretsManagerProviderDeleteSecretParams,
  SecretsManagerProviderGetSecretParams,
  SecretsManagerProviderGetSecretResult,
  SecretsManagerProviderUpdateSecretParams,
} from './types.js';

export class MemorySecretsManagerProvider implements SecretsManagerProvider {
  protected secrets: Record<string, {name: string; secret: string}> = {};

  addSecret = async (
    params: SecretsManagerProviderAddSecretParams
  ): Promise<SecretsManagerProviderAddSecretResult> => {
    const {name, text} = params;
    const id = getNewId();
    this.secrets[id] = {name, secret: text};

    return {secretId: id};
  };

  updateSecret = async (
    params: SecretsManagerProviderUpdateSecretParams
  ): Promise<SecretsManagerProviderAddSecretResult> => {
    const {name, text, secretId} = params;
    this.secrets[secretId] = {name, secret: text};

    return {secretId};
  };

  deleteSecret = async (params: SecretsManagerProviderDeleteSecretParams) => {
    const {secretId} = params;
    delete this.secrets[secretId];
  };

  getSecret = async (
    params: SecretsManagerProviderGetSecretParams
  ): Promise<SecretsManagerProviderGetSecretResult> => {
    const {secretId: id} = params;
    const secret = this.secrets[id];

    appAssert(secret, new Error('Secret not found'));
    return {text: secret.secret};
  };

  dispose = noop;
}
