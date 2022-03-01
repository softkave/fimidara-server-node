import fs from 'fs';
import {
  IConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
} from '../src/email-templates/confirmEmailAddress';
import {
  IForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
} from '../src/email-templates/forgotPassword';

// Confirm email address email
const comfirmEmailAddressHTMLFile =
  './email-templates/templates/confirm-email-address-html.html';
const confirmEmailAddressTxtFile =
  './email-templates/templates/confirm-email-address-text.txt';

export function renderConfirmEmailAddressMedia() {
  const props: IConfirmEmailAddressEmailProps = {
    firstName: 'Abayomi',
    link: 'https://files.softkave.com/accounts/confirm-email-address?t=jwt-token',
  };

  const renderedHTML = confirmEmailAddressEmailHTML(props);
  const renderedText = confirmEmailAddressEmailText(props);
  fs.writeFileSync(comfirmEmailAddressHTMLFile, renderedHTML);
  fs.writeFileSync(confirmEmailAddressTxtFile, renderedText);
}

// Forgot password email
const forgotPasswordEmailHTMLFile =
  './email-templates/templates/forgot-password-html.html';
const forgotPasswordEmailTxtFile =
  './email-templates/templates/forgot-password-text.txt';

export function renderForgotPasswordMedia() {
  const props: IForgotPasswordEmailProps = {
    expiration: new Date(),
    link: 'https://files.softkave.com/accounts/forgot-password?t=jwt-token',
  };

  const renderedHTML = forgotPasswordEmailHTML(props);
  const renderedText = forgotPasswordEmailText(props);
  fs.writeFileSync(forgotPasswordEmailHTMLFile, renderedHTML);
  fs.writeFileSync(forgotPasswordEmailTxtFile, renderedText);
}
