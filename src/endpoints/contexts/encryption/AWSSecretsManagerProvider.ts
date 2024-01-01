import {
  CreateSecretCommand,
  DeleteSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
  UpdateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {appAssert} from '../../../utils/assertion';
import {kUtilsInjectables} from '../injection/injectables';
import {
  SecretsManagerProvider,
  SecretsManagerProviderAddSecretParams,
  SecretsManagerProviderAddSecretResult,
  SecretsManagerProviderDeleteSecretParams,
  SecretsManagerProviderGetSecretParams,
  SecretsManagerProviderGetSecretResult,
  SecretsManagerProviderUpdateSecretParams,
} from './types';

export class AWSSecretsManagerProvider implements SecretsManagerProvider {
  protected client: SecretsManagerClient;

  constructor() {
    const config = kUtilsInjectables.suppliedConfig();
    appAssert(config.awsConfig?.accessKeyId);
    appAssert(config.awsConfig?.region);
    appAssert(config.awsConfig?.secretAccessKey);

    const {accessKeyId, secretAccessKey, region} = config.awsConfig;
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

  close = async () => {
    await this.client.destroy();
  };
}
