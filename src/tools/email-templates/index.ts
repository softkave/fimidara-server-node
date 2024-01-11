import console from 'console';
import {globalDispose, globalSetup} from '../../endpoints/contexts/globalUtils';
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

  console.log('Writing templates');
  renderConfirmEmailAddressMedia();
  renderForgotPasswordMedia();
  renderCollaborationRequestMedia();
  renderCollaborationRequestRevokedMedia();
  renderCollaborationRequestResponseMedia();
  renderUpgradedFromWaitlistMedia();
  renderUsageExceededMedia();
  console.log('Completed writing templates');

  await globalDispose();
}

main();
