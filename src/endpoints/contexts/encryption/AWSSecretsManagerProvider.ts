import {
  CreateSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {appAssert} from '../../../utils/assertion';
import {kUtilsInjectables} from '../injectables';
import {
  SecretsManagerProvider,
  SecretsManagerProviderAddSecretParams,
  SecretsManagerProviderAddSecretResult,
  SecretsManagerProviderGetSecretParams,
  SecretsManagerProviderGetSecretResult,
} from './types';

export class AWSSecretsManagerProvider implements SecretsManagerProvider {
  protected client: SecretsManagerClient;

  constructor() {
    const config = kUtilsInjectables.config();
    appAssert(config.awsConfig);

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
    const input = {Name: name, SecretString: text};
    const command = new CreateSecretCommand(input);
    const response = await this.client.send(command);

    appAssert(response.ARN);
    return {id: response.ARN};
  };

  getSecret = async (
    params: SecretsManagerProviderGetSecretParams
  ): Promise<SecretsManagerProviderGetSecretResult> => {
    const {id} = params;
    const input = {SecretId: id};
    const command = new GetSecretValueCommand(input);
    const response = await this.client.send(command);

    appAssert(response.SecretString);
    return {text: response.SecretString};
  };
}
