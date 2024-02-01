import {globalDispose, globalSetup} from '../../endpoints/contexts/globalUtils';
import {kUtilsInjectables} from '../../endpoints/contexts/injection/injectables';
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
  await globalSetup();

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
