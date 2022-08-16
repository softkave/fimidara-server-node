import {faker} from '@faker-js/faker';
import * as fs from 'fs';
import {CollaborationRequestStatusType} from '../../src/definitions/collaborationRequest';
import {
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  ICollaborationRequestEmailProps,
} from '../../src/email-templates/collaborationRequest';
import {
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
  ICollaborationRequestResponseEmailProps,
} from '../../src/email-templates/collaborationRequestResponse';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  ICollaborationRequestRevokedEmailProps,
} from '../../src/email-templates/collaborationRequestRevoked';
import {
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
  IConfirmEmailAddressEmailProps,
} from '../../src/email-templates/confirmEmailAddress';
import {
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
  IForgotPasswordEmailProps,
} from '../../src/email-templates/forgotPassword';

// Confirm email address email
const comfirmEmailAddressHTMLFile =
  './tools/email-templates/templates/confirm-email-address-html.html';
const confirmEmailAddressTxtFile =
  './tools/email-templates/templates/confirm-email-address-text.txt';

export function renderConfirmEmailAddressMedia() {
  const props: IConfirmEmailAddressEmailProps = {
    firstName: 'Abayomi',
    link: 'https://fimidara.com/accounts/confirm-email-address?t=jwt-token',
  };

  const renderedHTML = confirmEmailAddressEmailHTML(props);
  const renderedText = confirmEmailAddressEmailText(props);
  fs.writeFileSync(comfirmEmailAddressHTMLFile, renderedHTML);
  fs.writeFileSync(confirmEmailAddressTxtFile, renderedText);
}

// Forgot password email
const forgotPasswordEmailHTMLFile =
  './tools/email-templates/templates/forgot-password-html.html';
const forgotPasswordEmailTxtFile =
  './tools/email-templates/templates/forgot-password-text.txt';

export function renderForgotPasswordMedia() {
  const props: IForgotPasswordEmailProps = {
    expiration: new Date(),
    link: 'https://fimidara.com/accounts/forgot-password?t=jwt-token',
  };

  const renderedHTML = forgotPasswordEmailHTML(props);
  const renderedText = forgotPasswordEmailText(props);
  fs.writeFileSync(forgotPasswordEmailHTMLFile, renderedHTML);
  fs.writeFileSync(forgotPasswordEmailTxtFile, renderedText);
}

// Collaboration request email
const collaborationRequestEmailHTMLFile =
  './tools/email-templates/templates/collaboration-request-html.html';
const collaborationRequestEmailTxtFile =
  './tools/email-templates/templates/collaboration-request-text.txt';

export function renderCollaborationRequestMedia() {
  const props: ICollaborationRequestEmailProps = {
    workspaceName: 'Fimidara',
    isRecipientAUser: true,
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
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
  './tools/email-templates/templates/collaboration-request-revoked-html.html';
const collaborationRequestRevokedEmailTxtFile =
  './tools/email-templates/templates/collaboration-request-revoked-text.txt';

export function renderCollaborationRequestRevokedMedia() {
  const props: ICollaborationRequestRevokedEmailProps = {
    workspaceName: 'Fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
  };

  const renderedHTML = collaborationRequestRevokedEmailHTML(props);
  const renderedText = collaborationRequestRevokedEmailText(props);
  fs.writeFileSync(collaborationRequestRevokedEmailHTMLFile, renderedHTML);
  fs.writeFileSync(collaborationRequestRevokedEmailTxtFile, renderedText);
}

// Collaboration request response email
const collaborationRequestResponseEmailHTMLFile =
  './tools/email-templates/templates/collaboration-request-response-html.html';
const collaborationRequestResponseEmailTxtFile =
  './tools/email-templates/templates/collaboration-request-response-text.txt';

export function renderCollaborationRequestResponseMedia() {
  const props: ICollaborationRequestResponseEmailProps = {
    workspaceName: 'Fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    recipientEmail: faker.internet.email(),
    response: CollaborationRequestStatusType.Accepted,
  };

  const renderedHTML = collaborationRequestResponseEmailHTML(props);
  const renderedText = collaborationRequestResponseEmailText(props);
  fs.writeFileSync(collaborationRequestResponseEmailHTMLFile, renderedHTML);
  fs.writeFileSync(collaborationRequestResponseEmailTxtFile, renderedText);
}
