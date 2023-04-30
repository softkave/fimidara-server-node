import {faker} from '@faker-js/faker';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {AppResourceType} from '../../definitions/system';
import {UsageRecordCategory} from '../../definitions/usageRecord';
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
import {
  UpgradedFromWaitlistEmailProps,
  upgradedFromWaitlistEmailHTML,
  upgradedFromWaitlistEmailText,
} from '../../emailTemplates/upgradedFromWaitlist';
import {
  UsageExceededEmailProps,
  usageExceededEmailHTML,
  usageExceededEmailText,
} from '../../emailTemplates/usageExceeded';
import {getTimestamp} from '../../utils/dateFns';

const basepath = './src/tools/email-templates/templates/';

function writeToFileSync(filename: string, htmlText: string, text: string) {
  const htmlFilepath = `${basepath}${filename}.html`;
  const textFilepath = `${basepath}${filename}.txt`;
  fse.ensureFileSync(htmlFilepath);
  fse.ensureFileSync(textFilepath);
  fs.writeFileSync(htmlFilepath, htmlText);
  fs.writeFileSync(textFilepath, text);
}

// Confirm email address email
export function renderConfirmEmailAddressMedia() {
  const props: ConfirmEmailAddressEmailProps = {
    firstName: 'Abayomi',
    link: 'https://fimidara.com/accounts/confirm-email-address?t=jwt-token',
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
  };

  const renderedHTML = confirmEmailAddressEmailHTML(props);
  const renderedText = confirmEmailAddressEmailText(props);
  writeToFileSync('confirmEmailAddress', renderedHTML, renderedText);
}

// Forgot password email
export function renderForgotPasswordMedia() {
  const props: ForgotPasswordEmailProps = {
    expiration: new Date(),
    link: 'https://fimidara.com/accounts/forgot-password?t=jwt-token',
    firstName: 'Abayomi',
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
  };

  const renderedHTML = forgotPasswordEmailHTML(props);
  const renderedText = forgotPasswordEmailText(props);
  writeToFileSync('forgotPassword', renderedHTML, renderedText);
}

// Collaboration request email
export function renderCollaborationRequestMedia() {
  const props: CollaborationRequestEmailProps = {
    workspaceName: 'Fimidara',
    isRecipientAUser: true,
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
    expires: getTimestamp(),
    message: 'Test collaboration request message. ' + 'Not too long, and not too short.',
    firstName: 'Abayomi',
  };

  const renderedHTML = collaborationRequestEmailHTML(props);
  const renderedText = collaborationRequestEmailText(props);
  writeToFileSync('collaborationRequest', renderedHTML, renderedText);
}

// Collaboration request revoked email
export function renderCollaborationRequestRevokedMedia() {
  const props: CollaborationRequestRevokedEmailProps = {
    workspaceName: 'Fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    firstName: 'Abayomi',
  };

  const renderedHTML = collaborationRequestRevokedEmailHTML(props);
  const renderedText = collaborationRequestRevokedEmailText(props);
  writeToFileSync('collaborationRequestRevoked', renderedHTML, renderedText);
}

// Collaboration request response email
export function renderCollaborationRequestResponseMedia() {
  const props: CollaborationRequestResponseEmailProps = {
    workspaceName: 'Fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    recipientEmail: faker.internet.email(),
    response: CollaborationRequestStatusType.Accepted,
    firstName: 'Abayomi',
  };

  const renderedHTML = collaborationRequestResponseEmailHTML(props);
  const renderedText = collaborationRequestResponseEmailText(props);
  writeToFileSync('collaborationRequestResponse', renderedHTML, renderedText);
}

// Usage exceeded
export function renderUsageExceededMedia() {
  const props: UsageExceededEmailProps = {
    workspaceName: 'Fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    firstName: 'Abayomi',
    threshold: {
      budget: 100,
      category: UsageRecordCategory.Storage,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: {
        agentId: '',
        agentTokenId: '',
        agentType: AppResourceType.User,
      },
    },
  };

  const renderedHTML = usageExceededEmailHTML(props);
  const renderedText = usageExceededEmailText(props);
  writeToFileSync('usageExceeded', renderedHTML, renderedText);
}

// Upgraded from waitlist
export function renderUpgradedFromWaitlistMedia() {
  const props: UpgradedFromWaitlistEmailProps = {
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    firstName: 'Abayomi',
  };

  const renderedHTML = upgradedFromWaitlistEmailHTML(props);
  const renderedText = upgradedFromWaitlistEmailText(props);
  writeToFileSync('upgradedFromWaitlist', renderedHTML, renderedText);
}
