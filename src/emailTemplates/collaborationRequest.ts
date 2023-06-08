import {formatDateTime} from '../utils/dateFns';
import {
  emailHelperChars,
  emailTemplateStyles,
  getCenteredContentHTML,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
} from './helpers';
import {BaseEmailTemplateProps} from './types';

export interface CollaborationRequestEmailProps extends BaseEmailTemplateProps {
  workspaceName: string;
  isRecipientAUser: boolean;
  message?: string;
  expires?: number;
}

export function collaborationRequestEmailTitle(workspaceName: string) {
  return `Collaboration request from ${workspaceName}`;
}

export function collaborationRequestEmailHTML(props: CollaborationRequestEmailProps) {
  const title = collaborationRequestEmailTitle(props.workspaceName);
  return `
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8" />
  <title>${getHeaderText(title)}</title>
  ${emailTemplateStyles}
</head>
<body>
  ${getHeaderHTML(title)}
  ${getCenteredContentHTML(`
    ${getGreetingHTML(props)}
    <p>
      You have a new collaboration request from <b>${props.workspaceName}</b>.
    </p>
    ${props.message ? `<p>Message: <br />${props.message}</p>` : ''}
    ${props.expires ? `<p>Expires: <br />${formatDateTime(props.expires)}</p>` : ''}
    <p>
      To respond to this request,
      ${
        props.isRecipientAUser
          ? `<a href="${props.loginLink}">Login to your account here</a>`
          : `<a href="${props.signupLink}">Signup here</a>`
      }
    </p>
    `)}
  ${getFooterHTML()}
</body>
</html>
    `;
}

export function collaborationRequestEmailText(props: CollaborationRequestEmailProps) {
  let linkText = '';
  const title = collaborationRequestEmailTitle(props.workspaceName);
  if (props.isRecipientAUser) {
    linkText = `Login to your account here - ${props.loginLink}`;
  } else {
    linkText = `Create an account here - ${props.signupLink}`;
  }

  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
You have a new collaboration request from ${props.workspaceName}.
${props.message ? `Message: ${props.message}.` : ''}
${props.expires ? `Expires: ${formatDateTime(props.expires)}` : ''}
${emailHelperChars.emDash}
To respond to this request, ${linkText}
  `;

  return txt;
}
