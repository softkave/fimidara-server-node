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
import {
  ICollaborationRequestEmailProps,
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
} from '../src/email-templates/collaborationRequest';
import {
  ICollaborationRequestRevokedEmailProps,
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
} from '../src/email-templates/collaborationRequestRevoked';

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

// Collaboration request email
const collaborationRequestEmailHTMLFile =
  './email-templates/templates/collaboration-request-html.html';
const collaborationRequestEmailTxtFile =
  './email-templates/templates/collaboration-request-text.txt';

export function renderCollaborationRequestMedia() {
  const props: ICollaborationRequestEmailProps = {
    organizationName: 'Files by Softkave',
    isRecipientAUser: true,
    loginLink: 'https://files.softkave.com/accounts/signup',
    signupLink: 'https://files.softkave.com/accounts/login',
    expires: new Date().toISOString(),
    message:
      'Test collaboration request message. ' +
      'Not too long, and not too short.',
  };

  const renderedHTML = collaborationRequestEmailHTML(props);
  const renderedText = collaborationRequestEmailText(props);
  fs.writeFileSync(collaborationRequestEmailHTMLFile, renderedHTML);
  fs.writeFileSync(collaborationRequestEmailTxtFile, renderedText);
}

// Collaboration request revoked email
const collaborationRequestRevokedEmailHTMLFile =
  './email-templates/templates/collaboration-request-revoked-html.html';
const collaborationRequestRevokedEmailTxtFile =
  './email-templates/templates/collaboration-request-revoked-text.txt';

export function renderCollaborationRequestRevokedMedia() {
  const props: ICollaborationRequestRevokedEmailProps = {
    organizationName: 'Files by Softkave',
  };

  const renderedHTML = collaborationRequestRevokedEmailHTML(props);
  const renderedText = collaborationRequestRevokedEmailText(props);
  fs.writeFileSync(collaborationRequestRevokedEmailHTMLFile, renderedHTML);
  fs.writeFileSync(collaborationRequestRevokedEmailTxtFile, renderedText);
}
