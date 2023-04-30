import {defaultStaticVars} from '../resources/vars';
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
} from './helpers';
import {BaseEmailTemplateProps} from './types';

export const upgradedFromWaitlistEmailTitle = `You've been upgraded from the waitlist`;
const message = `You've been upgraded from the waitlist, now you have full access to ${defaultStaticVars.appName}.`;

export interface UpgradedFromWaitlistEmailProps extends BaseEmailTemplateProps {
  firstName: string;
}

export function upgradedFromWaitlistEmailHTML(props: UpgradedFromWaitlistEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <title>${getHeaderText(upgradedFromWaitlistEmailTitle)}</title>
  ${emailTemplateStyles}
</head>
<body>
  ${getHeaderHTML(upgradedFromWaitlistEmailTitle)}
  <div class="${emailStylingHelpers.classNamePrefix}-body">
    <div class="${emailStylingHelpers.classNamePrefix}-content-center">
      ${getGreetingHTML(props)}
      <p>${message}</p>
      ${getLoginSectionHTML(props)}
    </div>
  </div>
  ${getFooterHTML()}
</body>
</html>
  `;
}

export function upgradedFromWaitlistEmailText(props: UpgradedFromWaitlistEmailProps): string {
  const text = `${getHeaderText(upgradedFromWaitlistEmailTitle)}
${emailHelperChars.emDash}
${getGreetingText(props)}
${message}
${getLoginSectionText(props)}
`;

  return text;
}
