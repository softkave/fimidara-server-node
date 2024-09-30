import {
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
  UpdateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {AWSConfig} from '../../resources/config.js';
import {appAssert} from '../../utils/assertion.js';
import {
  SecretsManagerProvider,
  SecretsManagerProviderAddSecretParams,
  SecretsManagerProviderAddSecretResult,
  SecretsManagerProviderDeleteSecretParams,
  SecretsManagerProviderGetSecretParams,
  SecretsManagerProviderGetSecretResult,
  SecretsManagerProviderUpdateSecretParams,
} from './types.js';

export class AWSSecretsManagerProvider implements SecretsManagerProvider {
  protected client: SecretsManagerClient;

  constructor(params: AWSConfig) {
    const {accessKeyId, secretAccessKey, region} = params;
    this.client = new SecretsManagerClient({
      region,
      credentials: {accessKeyId, secretAccessKey},
    });
  }

  addSecret = async (
    params: SecretsManagerProviderAddSecretParams
  ): Promise<SecretsManagerProviderAddSecretResult> => {
    const {name, text} = params;
    const command = new CreateSecretCommand({Name: name, SecretString: text});
    const response = await this.client.send(command);

    appAssert(response.ARN);
    return {secretId: response.ARN};
  };

  updateSecret = async (
    params: SecretsManagerProviderUpdateSecretParams
  ): Promise<SecretsManagerProviderAddSecretResult> => {
    const {text, secretId} = params;
    const command = new UpdateSecretCommand({
      SecretString: text,
      SecretId: secretId,
    });
    const response = await this.client.send(command);

    appAssert(response.ARN);
    return {secretId: response.ARN};
  };

  deleteSecret = async (params: SecretsManagerProviderDeleteSecretParams) => {
    const {secretId} = params;
    const command = new DeleteSecretCommand({
      SecretId: secretId,
    });
    await this.client.send(command);
  };

  getSecret = async (
    params: SecretsManagerProviderGetSecretParams
  ): Promise<SecretsManagerProviderGetSecretResult> => {
    const {secretId: id} = params;
    const input = {SecretId: id};
    const command = new GetSecretValueCommand(input);
    const response = await this.client.send(command);

    appAssert(response.SecretString);
    return {text: response.SecretString};
  };

  dispose = async () => {
    await this.client.destroy();
  };
}
