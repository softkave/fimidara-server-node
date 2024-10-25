import {globalDispose} from '../../contexts/globalUtils.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {registerUtilsInjectables} from '../../contexts/injection/register.js';
import {
  kFimidaraConfigDbType,
  kFimidaraConfigPubSubProvider,
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
  await registerUtilsInjectables({
    dbType: kFimidaraConfigDbType.noop,
    queueProvider: kFimidaraConfigQueueProvider.memory,
    pubSubProvider: kFimidaraConfigPubSubProvider.memory,
  });

  kUtilsInjectables.logger().log('Writing templates');

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

  kUtilsInjectables.logger().log('Completed writing templates');
  await globalDispose();
}

main();
