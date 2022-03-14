import {formatDateTime} from '../utilities/dateFns';
import {
  emailTemplateStyles,
  getCenteredContentHTML,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
} from './helpers';

export interface ICollaborationRequestEmailProps {
  signupLink: string;
  loginLink: string;
  organizationName: string;
  isRecipientAUser: boolean;
  message?: string;
  expires?: string;
}

export function collaborationRequestEmailTitle(organizationName: string) {
  return `Collaboration Request from ${organizationName}`;
}

export function collaborationRequestEmailHTML(
  props: ICollaborationRequestEmailProps
) {
  const title = collaborationRequestEmailTitle(props.organizationName);
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
        <p>
            You have a new collaboration request from <b>${
              props.organizationName
            }</b>.
        </p>
        ${props.message ? `<p>Message - <br />${props.message}</p>` : ''}
        ${
          props.expires
            ? `<p>Expires - <br />${formatDateTime(props.expires)}</p>`
            : ''
        }
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

export function collaborationRequestEmailText(
  props: ICollaborationRequestEmailProps
) {
  let linkText = '';
  const title = collaborationRequestEmailTitle(props.organizationName);

  if (props.isRecipientAUser) {
    linkText = `
      Login to your account here - 
      ${props.loginLink}
    `;
  } else {
    linkText = `
      Create an account here - 
      ${props.signupLink}
    `;
  }

  const txt = `
${getHeaderText(title)}
-
You have a new collaboration request from ${props.organizationName}.
${props.message ? `Message - ${props.message}.` : ''}
${props.expires ? `Expires - ${formatDateTime(props.expires)}` : ''}
-
To respond to this request, ${linkText}
  `;

  return txt;
}
