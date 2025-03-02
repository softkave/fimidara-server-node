import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {
  emailHelperChars,
  emailStylingHelpers,
  emailTemplateStyles,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
  getLoginSectionHTML,
  getLoginSectionText,
} from './helpers.js';
import {BaseEmailTemplateProps} from './types.js';

export const kUpgradeFromWaitlistEmailArtifacts = {
  title: "You've been upgraded from the waitlist",
  message: () =>
    `You've been upgraded from the waitlist, now you have full access to ${
      kIjxUtils.suppliedConfig().appName
    }`,
};

export interface UpgradedFromWaitlistEmailProps extends BaseEmailTemplateProps {
  firstName: string;
}

export function upgradedFromWaitlistEmailHTML(
  props: UpgradedFromWaitlistEmailProps
): string {
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <title>${getHeaderText(kUpgradeFromWaitlistEmailArtifacts.title)}</title>
  ${emailTemplateStyles}
</head>
<body>
  ${getHeaderHTML(kUpgradeFromWaitlistEmailArtifacts.title)}
  <div class="${emailStylingHelpers.classNamePrefix}-body">
    <div class="${emailStylingHelpers.classNamePrefix}-content-center">
      ${getGreetingHTML(props)}
      <p>${kUpgradeFromWaitlistEmailArtifacts.message()}</p>
    </div>
  </div>
  ${getLoginSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
  `;
}

export function upgradedFromWaitlistEmailText(
  props: UpgradedFromWaitlistEmailProps
): string {
  const text = `${getHeaderText(kUpgradeFromWaitlistEmailArtifacts.title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
${kUpgradeFromWaitlistEmailArtifacts.message()}
${getLoginSectionText(props)}
`;

  return text;
}
