import {faker} from '@faker-js/faker';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import {kCollaborationRequestStatusTypeMap} from '../../definitions/collaborationRequest.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {kUsageRecordCategory} from '../../definitions/usageRecord.js';
import {
  CollaborationRequestEmailProps,
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
} from '../../emailTemplates/collaborationRequest.js';
import {
  CollaborationRequestResponseEmailProps,
  collaborationRequestResponseEmailHTML,
  collaborationRequestResponseEmailText,
} from '../../emailTemplates/collaborationRequestResponse.js';
import {
  CollaborationRequestRevokedEmailProps,
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
} from '../../emailTemplates/collaborationRequestRevoked.js';
import {
  ConfirmEmailAddressEmailProps,
  confirmEmailAddressEmailHTML,
  confirmEmailAddressEmailText,
} from '../../emailTemplates/confirmEmailAddress.js';
import {
  ForgotPasswordEmailProps,
  forgotPasswordEmailHTML,
  forgotPasswordEmailText,
} from '../../emailTemplates/forgotPassword.js';
import {
  NewSignupsOnWaitlistEmailProps,
  newSignupsOnWaitlistEmailHTML,
  newSignupsOnWaitlistEmailText,
} from '../../emailTemplates/newSignupsOnWaitlist.js';
import {
  UpgradedFromWaitlistEmailProps,
  upgradedFromWaitlistEmailHTML,
  upgradedFromWaitlistEmailText,
} from '../../emailTemplates/upgradedFromWaitlist.js';
import {
  UsageExceededEmailProps,
  usageExceededEmailHTML,
  usageExceededEmailText,
} from '../../emailTemplates/usageExceeded.js';
import {getTimestamp} from '../../utils/dateFns.js';

const basepath = './src/tools/email-templates/templates/';

async function writeToFile(filename: string, htmlText: string, text: string) {
  const htmlFilepath = `${basepath}${filename}.html`;
  const textFilepath = `${basepath}${filename}.txt`;

  await Promise.all([
    fse.ensureFile(htmlFilepath),
    fse.ensureFile(textFilepath),
  ]);

  await Promise.all([
    fs.promises.writeFile(htmlFilepath, htmlText),
    fs.promises.writeFile(textFilepath, text),
  ]);
}

// Confirm email address email
export async function renderConfirmEmailAddressMedia() {
  const props: ConfirmEmailAddressEmailProps = {
    firstName: 'Abayomi',
    link: 'https://fimidara.com/accounts/confirm-email-address?t=jwt-token',
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
  };

  const renderedHTML = confirmEmailAddressEmailHTML(props);
  const renderedText = confirmEmailAddressEmailText(props);
  await writeToFile('confirmEmailAddress', renderedHTML, renderedText);
}

// Forgot password email
export async function renderForgotPasswordMedia() {
  const props: ForgotPasswordEmailProps = {
    expiration: new Date(),
    link: 'https://fimidara.com/accounts/forgot-password?t=jwt-token',
    firstName: 'Abayomi',
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
  };

  const renderedHTML = forgotPasswordEmailHTML(props);
  const renderedText = forgotPasswordEmailText(props);
  await writeToFile('forgotPassword', renderedHTML, renderedText);
}

// Collaboration request email
export async function renderCollaborationRequestMedia() {
  const props: CollaborationRequestEmailProps = {
    workspaceName: 'fimidara',
    isRecipientAUser: true,
    loginLink: 'https://fimidara.com/accounts/signup',
    signupLink: 'https://fimidara.com/accounts/login',
    expires: getTimestamp(),
    message:
      'Test collaboration request message. ' +
      'Not too long, and not too short',
    firstName: 'Abayomi',
  };

  const renderedHTML = collaborationRequestEmailHTML(props);
  const renderedText = collaborationRequestEmailText(props);
  await writeToFile('collaborationRequest', renderedHTML, renderedText);
}

// Collaboration request revoked email
export async function renderCollaborationRequestRevokedMedia() {
  const props: CollaborationRequestRevokedEmailProps = {
    workspaceName: 'fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    firstName: 'Abayomi',
  };

  const renderedHTML = collaborationRequestRevokedEmailHTML(props);
  const renderedText = collaborationRequestRevokedEmailText(props);
  await writeToFile('collaborationRequestRevoked', renderedHTML, renderedText);
}

// Collaboration request response email
export async function renderCollaborationRequestResponseMedia() {
  const props: CollaborationRequestResponseEmailProps = {
    workspaceName: 'fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    recipientEmail: faker.internet.email(),
    response: kCollaborationRequestStatusTypeMap.Accepted,
    firstName: 'Abayomi',
  };

  const renderedHTML = collaborationRequestResponseEmailHTML(props);
  const renderedText = collaborationRequestResponseEmailText(props);
  await writeToFile('collaborationRequestResponse', renderedHTML, renderedText);
}

// Usage exceeded
export async function renderUsageExceededMedia() {
  const props: UsageExceededEmailProps = {
    workspaceName: 'fimidara',
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    firstName: 'Abayomi',
    threshold: {
      budget: 100,
      usage: 100,
      category: kUsageRecordCategory.storage,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: {
        agentId: '',
        agentTokenId: '',
        agentType: kFimidaraResourceType.User,
      },
    },
  };

  const renderedHTML = usageExceededEmailHTML(props);
  const renderedText = usageExceededEmailText(props);
  await writeToFile('usageExceeded', renderedHTML, renderedText);
}

// Upgraded from waitlist
export async function renderUpgradedFromWaitlistMedia() {
  const props: UpgradedFromWaitlistEmailProps = {
    signupLink: 'https://fimidara.com/accounts/signup',
    loginLink: 'https://fimidara.com/accounts/login',
    firstName: 'Abayomi',
  };

  const renderedHTML = upgradedFromWaitlistEmailHTML(props);
  const renderedText = upgradedFromWaitlistEmailText(props);
  await writeToFile('upgradedFromWaitlist', renderedHTML, renderedText);
}

// New  signups on waitlist
export async function renderNewSignupsOnWaitlistMedia() {
  const props: NewSignupsOnWaitlistEmailProps = {
    count: 5,
    firstName: 'Abayomi',
    loginLink: 'https://fimidara.com/accounts/login',
    signupLink: 'https://fimidara.com/accounts/signup',
    upgradeWaitlistURL: 'https://fimidara.com/internals/waitlist',
  };

  const renderedHTML = newSignupsOnWaitlistEmailHTML(props);
  const renderedText = newSignupsOnWaitlistEmailText(props);
  await writeToFile('newSignupsOnWaitlist', renderedHTML, renderedText);
}
