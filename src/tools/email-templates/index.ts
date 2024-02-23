import {globalDispose} from '../../endpoints/contexts/globalUtils';
import {kUtilsInjectables} from '../../endpoints/contexts/injection/injectables';
import {registerUtilsInjectables} from '../../endpoints/contexts/injection/register';
import {kFimidaraConfigDbType} from '../../resources/config';
import {
  renderCollaborationRequestMedia,
  renderCollaborationRequestResponseMedia,
  renderCollaborationRequestRevokedMedia,
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
  renderUpgradedFromWaitlistMedia,
  renderUsageExceededMedia,
} from './renderToFile';

async function main() {
  await registerUtilsInjectables({dbType: kFimidaraConfigDbType.noop});

  kUtilsInjectables.logger().log('Writing templates');
  renderConfirmEmailAddressMedia();
  renderForgotPasswordMedia();
  renderCollaborationRequestMedia();
  renderCollaborationRequestRevokedMedia();
  renderCollaborationRequestResponseMedia();
  renderUpgradedFromWaitlistMedia();
  renderUsageExceededMedia();
  kUtilsInjectables.logger().log('Completed writing templates');

  await globalDispose();
}

main();
