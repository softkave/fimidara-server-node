import assert from 'assert';
import {merge} from 'lodash-es';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigSecretsManagerProvider,
} from '../../resources/config.js';
import {AWSSecretsManagerProvider} from './AWSSecretsManagerProvider.js';
import {MemorySecretsManagerProvider} from './MemorySecretsManagerProvider.js';

export function getSecretsProvider(config: FimidaraSuppliedConfig) {
  if (
    config.secretsManagerProvider ===
    kFimidaraConfigSecretsManagerProvider.awsSecretsManager
  ) {
    const {accessKeyId, region, secretAccessKey} = merge(
      {},
      config.awsConfigs?.all,
      config.awsConfigs?.secretsManager
    );

    assert(accessKeyId, 'Provide accessKeyId for AWS SecretsManager provider');
    assert(region, 'Provide region for AWS SecretsManager provider');
    assert(
      secretAccessKey,
      'Provide secretAccessKey for AWS SecretsManager provider'
    );

    return new AWSSecretsManagerProvider({
      accessKeyId,
      region,
      secretAccessKey,
    });
  } else if (
    config.secretsManagerProvider ===
    kFimidaraConfigSecretsManagerProvider.memory
  ) {
    return new MemorySecretsManagerProvider();
  }

  throw new Error(
    `Unknown secrets manager provider: ${config.secretsManagerProvider}`
  );
}
