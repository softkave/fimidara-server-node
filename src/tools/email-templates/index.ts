import {globalDispose} from '../../endpoints/contexts/globalUtils.js';
import {kUtilsInjectables} from '../../endpoints/contexts/injection/injectables.js';
import {registerUtilsInjectables} from '../../endpoints/contexts/injection/register.js';
import {kFimidaraConfigDbType} from '../../resources/config.js';
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
  await registerUtilsInjectables({dbType: kFimidaraConfigDbType.noop});
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
