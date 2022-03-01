import {
  renderConfirmEmailAddressMedia,
  renderForgotPasswordMedia,
} from './renderToFile';

console.log('Writing templates');
renderConfirmEmailAddressMedia();
renderForgotPasswordMedia();
console.log('Completed writing templates');
