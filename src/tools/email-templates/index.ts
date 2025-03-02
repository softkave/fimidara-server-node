import {globalDispose} from '../../contexts/globalUtils.js';
import {kIjxUtils} from '../../contexts/ijx/injectables.js';
import {registerIjxUtils} from '../../contexts/ijx/register.js';
import {
  kFimidaraConfigDbType,
  kFimidaraConfigQueueProvider,
} from '../../resources/config.js';
import {
  renderCollaborationRequestMedia,
  renderCollaborationRequestResponseMedia,
  renderCollaborationRequestRevokedMedia,
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
  renderNewSignupsOnWaitlistMedia,
  renderUpgradedFromWaitlistMedia,
  renderUsageExceededMedia,
} from './renderToFile.js';

async function main() {
  await registerIjxUtils({
    dbType: kFimidaraConfigDbType.noop,
    queueProvider: kFimidaraConfigQueueProvider.memory,
    pubSubProvider: kFimidaraConfigQueueProvider.memory,
    cacheProvider: kFimidaraConfigQueueProvider.memory,
    redlockProvider: kFimidaraConfigQueueProvider.memory,
    dsetProvider: kFimidaraConfigQueueProvider.memory,
    redisURL: '',
  });

  kIjxUtils.logger().log('Writing templates');

  await Promise.all([
    renderConfirmEmailAddressMedia(),
    renderForgotPasswordMedia(),
    renderCollaborationRequestMedia(),
    renderCollaborationRequestRevokedMedia(),
    renderCollaborationRequestResponseMedia(),
    renderUpgradedFromWaitlistMedia(),
    renderUsageExceededMedia(),
    renderNewSignupsOnWaitlistMedia(),
  ]);

  kIjxUtils.logger().log('Completed writing templates');
  await globalDispose();
}

main();
