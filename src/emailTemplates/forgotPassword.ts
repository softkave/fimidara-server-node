import {format, formatDistance} from 'date-fns';
import {
  emailHelperChars,
  emailStylingHelpers,
  emailTemplateStyles,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
} from './helpers';
import {BaseEmailTemplateProps} from './types';

export const forgotPasswordEmailTitle = 'Change your password';

export interface ForgotPasswordEmailProps extends BaseEmailTemplateProps {
  link: string;
  expiration: Date;
}

export function forgotPasswordEmailHTML(props: ForgotPasswordEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <title>${getHeaderText(forgotPasswordEmailTitle)}</title>
  ${emailTemplateStyles}
</head>
<body>
  ${getHeaderHTML(forgotPasswordEmailTitle)}
  <div class="${emailStylingHelpers.classNamePrefix}-body">
    <div class="${emailStylingHelpers.classNamePrefix}-content-center">
      ${getGreetingHTML(props)}
      <p>
        To change your password,
        <a href="${props.link}">click here</a>.
      </p>
      <p>- OR -</p>
      <p>
        Copy the following link, and visit in your browser: <br />
        <a href="${props.link}">${props.link}</a>
      </p>
      <p>
        <strong>
          This link expires in ${formatDistance(props.expiration, new Date())}, on ${format(
    props.expiration,
    'MM/dd/yyyy hh:mm aaa'
  )}.
        </strong>
      </p>
      <p>
        If you did not request a change of password, please ignore this
        mail.
        <br />
        Do not share this link with anybody, as they will be able to
        change your password with it.
      </p>
    </div>
  </div>
  ${getFooterHTML()}
</body>
</html>
  `;
}

export function forgotPasswordEmailText(props: ForgotPasswordEmailProps): string {
  const text = `${getHeaderText(forgotPasswordEmailTitle)}
${emailHelperChars.emDash}
${getGreetingText(props)}
To change your password, copy the following link, and visit in your browser: ${props.link}
${emailHelperChars.emDash}
This link expires:
1. Immediately after you change your password ${emailHelperChars.emDash} OR ${
    emailHelperChars.emDash
  }
2. In ${formatDistance(props.expiration, new Date())}, on ${format(
    props.expiration,
    'MM/dd/yyyy hh:mm aaa'
  )}.
${emailHelperChars.emDash}
If you did not request a change of password, please ignore this mail.
Do not share this link with anybody, as they will be able to change your password with it.
`;

  return text;
}
