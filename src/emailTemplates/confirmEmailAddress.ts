import {
  emailTemplateConstants,
  emailTemplateStyles,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
} from './helpers';

export const confirmEmailAddressEmailTitle = 'Confirm your email address';

export interface ConfirmEmailAddressEmailProps {
  firstName: string;
  link: string;
}

export function confirmEmailAddressEmailHTML(props: ConfirmEmailAddressEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <title>${getHeaderText(confirmEmailAddressEmailTitle)}</title>
  ${emailTemplateStyles}
</head>
<body>
  ${getHeaderHTML(confirmEmailAddressEmailTitle)}
  <div class="${emailTemplateConstants.classNamePrefix}-body">
    <div class="${emailTemplateConstants.classNamePrefix}-content-center">
      <p>
        Hi ${props.firstName}, click the link below to verify your email address.
        <br />
        <a href="${props.link}">${props.link}</a>
      </p>
    </div>
  </div>
  ${getFooterHTML()}
</body>
</html>
  `;
}

export function confirmEmailAddressEmailText(props: ConfirmEmailAddressEmailProps): string {
  const text = `
${getHeaderText(confirmEmailAddressEmailTitle)}
-
Hi ${props.firstName}, visit the link below to verify your email address:
${props.link} 
`;

  return text;
}
