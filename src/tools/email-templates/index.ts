import {
  renderCollaborationRequestMedia,
  renderCollaborationRequestResponseMedia,
  renderCollaborationRequestRevokedMedia,
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
  renderUpgradedFromWaitlistMedia,
  renderUsageExceededMedia,
} from './renderToFile';

console.log('Writing templates');
renderConfirmEmailAddressMedia();
renderForgotPasswordMedia();
renderCollaborationRequestMedia();
renderCollaborationRequestRevokedMedia();
renderCollaborationRequestResponseMedia();
renderUpgradedFromWaitlistMedia();
renderUsageExceededMedia();
console.log('Completed writing templates');
process.exit(0);
