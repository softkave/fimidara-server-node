import {
  emailTemplateStyles,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
} from './helpers';

export interface ICollaborationRequestEmailProps {
  signupLink: string;
  loginLink: string;
  organizationName: string;
  isRecipientAUser: boolean;
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
        <style>${emailTemplateStyles}</style>
    </head>
    <body>
        ${getHeaderHTML(title)}
        <p>
            You have a new collaboration request from <b>${
              props.organizationName
            }</b>.
        </p>
        <p>
            To respond to this request,
            ${
              props.isRecipientAUser
                ? `<a href="${props.loginLink}">Login to your account here</a>`
                : `<a href="${props.signupLink}">Signup here</a>`
            }
        </p>
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
    You have a new collaboration request from ${props.organizationName}
    -
    To respond to this request, ${linkText}
  `;

  return txt;
}
