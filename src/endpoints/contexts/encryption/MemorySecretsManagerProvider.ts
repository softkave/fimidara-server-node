import {appAssert} from '../../../utils/assertion';
import {getNewId} from '../../../utils/resource';
import {
  SecretsManagerProvider,
  SecretsManagerProviderAddSecretParams,
  SecretsManagerProviderAddSecretResult,
  SecretsManagerProviderGetSecretParams,
  SecretsManagerProviderGetSecretResult,
} from './types';

export class MemorySecretsManagerProvider implements SecretsManagerProvider {
  protected secrets: Record<string, {name: string; secret: string}> = {};

  addSecret = async (
    params: SecretsManagerProviderAddSecretParams
  ): Promise<SecretsManagerProviderAddSecretResult> => {
    const {name, text} = params;
    const id = getNewId();
    this.secrets[id] = {name, secret: text};

    return {id};
  };

  getSecret = async (
    params: SecretsManagerProviderGetSecretParams
  ): Promise<SecretsManagerProviderGetSecretResult> => {
    const {id} = params;
    const secret = this.secrets[id];

    appAssert(secret, new Error('Secret not found'));
    return {text: secret.secret};
  };
}
