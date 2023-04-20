import {faker} from '@faker-js/faker';
import * as fs from 'fs';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {
  CollaborationRequestEmailProps,
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
} from '../../emailTemplates/collaborationRequest';
import {
  CollaborationRequestResponseEmailProps,
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
} from '../../emailTemplates/collaborationRequestResponse';
import {
  CollaborationRequestRevokedEmailProps,
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
} from '../../emailTemplates/collaborationRequestRevoked';
import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
} from '../../emailTemplates/confirmEmailAddress';
import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
} from '../../emailTemplates/forgotPassword';
import {getTimestamp} from '../../utils/dateFns';

// Confirm email address email
const comfirmEmailAddressHTMLFile =
  './tools/emailTemplates/templates/confirm-email-address-html.html';
const confirmEmailAddressTxtFile =
  './tools/emailTemplates/templates/confirm-email-address-text.txt';

export function renderConfirmEmailAddressMedia() {
  const props: ConfirmEmailAddressEmailProps = {
    firstName: 'Abayomi',
    link: 'https://fimidara.com/accounts/confirm-email-address?t=jwt-token',
  };

  const renderedHTML = confirmEmailAddressEmailHTML(props);
  const renderedText = confirmEmailAddressEmailText(props);
  fs.writeFileSync(comfirmEmailAddressHTMLFile, renderedHTML);
  fs.writeFileSync(confirmEmailAddressTxtFile, renderedText);
}

// Forgot password email
const forgotPasswordEmailHTMLFile = './tools/emailTemplates/templates/forgot-password-html.html';
const forgotPasswordEmailTxtFile = './tools/emailTemplates/templates/forgot-password-text.txt';

export function renderForgotPasswordMedia() {
  const props: ForgotPasswordEmailProps = {
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
  './tools/emailTemplates/templates/collaboration-request-html.html';
const collaborationRequestEmailTxtFile =
  './tools/emailTemplates/templates/collaboration-request-text.txt';

export function renderCollaborationRequestMedia() {
  const props: CollaborationRequestEmailProps = {
    workspaceName: 'Fimidara',
    isRecipientAUser: true,
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
    expires: getTimestamp(),
    message: 'Test collaboration request message. ' + 'Not too long, and not too short.',
  };

  const renderedHTML = collaborationRequestEmailHTML(props);
  const renderedText = collaborationRequestEmailText(props);
  fs.writeFileSync(collaborationRequestEmailHTMLFile, renderedHTML);
  fs.writeFileSync(collaborationRequestEmailTxtFile, renderedText);
}

// Collaboration request revoked email
const collaborationRequestRevokedEmailHTMLFile =
  './tools/emailTemplates/templates/collaboration-request-revoked-html.html';
const collaborationRequestRevokedEmailTxtFile =
  './tools/emailTemplates/templates/collaboration-request-revoked-text.txt';

export function renderCollaborationRequestRevokedMedia() {
  const props: CollaborationRequestRevokedEmailProps = {
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
  './tools/emailTemplates/templates/collaboration-request-response-html.html';
const collaborationRequestResponseEmailTxtFile =
  './tools/emailTemplates/templates/collaboration-request-response-text.txt';

export function renderCollaborationRequestResponseMedia() {
  const props: CollaborationRequestResponseEmailProps = {
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
