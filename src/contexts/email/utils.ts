import assert from 'assert';
import {merge} from 'lodash-es';
import NoopEmailProviderContext from '../../endpoints/testHelpers/context/email/NoopEmailProviderContext.js';
import {
  FimidaraSuppliedConfig,
  kFimidaraConfigEmailProvider,
} from '../../resources/config.js';
import {SESEmailProviderContext} from './SESEmailProviderContext.js';

export function getEmailProvider(config: FimidaraSuppliedConfig) {
  if (config.emailProvider === kFimidaraConfigEmailProvider.ses) {
    const {accessKeyId, region, secretAccessKey} = merge(
      {},
      config.awsConfigs?.all,
      config.awsConfigs?.ses
    );

    assert(accessKeyId, 'provide accessKeyId for AWS SES email provider');
    assert(region, 'provide region for AWS SES email provider');
    assert(
      secretAccessKey,
      'provide secretAccessKey for AWS SES email provider'
    );

    return new SESEmailProviderContext({
      accessKeyId,
      region,
      secretAccessKey,
    });
  } else if (config.emailProvider === kFimidaraConfigEmailProvider.noop) {
    return new NoopEmailProviderContext();
  }

  throw new Error(`Unknown email provider: ${config.emailProvider}`);
}
