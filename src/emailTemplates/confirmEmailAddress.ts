import {
  emailHelperChars,
  emailStylingHelpers,
  emailTemplateStyles,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
} from './helpers.js';
import {BaseEmailTemplateProps} from './types.js';

export const kConfirmEmailAddressEmail = {
  title: 'Confirm your email address',
};

export interface ConfirmEmailAddressEmailProps extends BaseEmailTemplateProps {
  firstName: string;
  link: string;
}

export function confirmEmailAddressEmailHTML(
  props: ConfirmEmailAddressEmailProps
): string {
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <title>${getHeaderText(kConfirmEmailAddressEmail.title)}</title>
  ${emailTemplateStyles}
</head>
<body>
  ${getHeaderHTML(kConfirmEmailAddressEmail.title)}
  <div class="${emailStylingHelpers.classNamePrefix}-body">
    <div class="${emailStylingHelpers.classNamePrefix}-content-center">
      ${getGreetingHTML(props)}
      <p>
        Click the link below to verify your email address.<br />
        <a href="${props.link}">${props.link}</a>
      </p>
    </div>
  </div>
  ${getFooterHTML()}
</body>
</html>
  `;
}

export function confirmEmailAddressEmailText(
  props: ConfirmEmailAddressEmailProps
): string {
  const text = `${getHeaderText(kConfirmEmailAddressEmail.title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
Visit the link below to verify your email address:
${props.link} 
`;

  return text;
}
