import {
  renderCollaborationRequestMedia,
  renderCollaborationRequestRevokedMedia,
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
} from './renderToFile';

console.log('Writing templates');
renderConfirmEmailAddressMedia();
renderForgotPasswordMedia();
renderCollaborationRequestMedia();
renderCollaborationRequestRevokedMedia();
console.log('Completed writing templates');
process.exit(0);
