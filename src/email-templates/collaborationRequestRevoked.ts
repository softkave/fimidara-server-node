import {
  emailTemplateStyles,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
} from './helpers';

export interface ICollaborationRequestRevokedEmailProps {
  organizationName: string;
}

export function collaborationRequestRevokedEmailTitle(
  organizationName: string
) {
  return `Collaboration Request from ${organizationName} Revoked`;
}

export function collaborationRequestRevokedEmailHTML(
  props: ICollaborationRequestRevokedEmailProps
) {
  const title = collaborationRequestRevokedEmailTitle(props.organizationName);
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
            This is to notify you that the collaboration request sent from ${
              props.organizationName
            } has been revoked.
        </p>
        <p>
        </p>
        ${getFooterHTML()}
    </body>
    </html>
    `;
}

export function collaborationRequestRevokedEmailText(
  props: ICollaborationRequestRevokedEmailProps
) {
  const title = collaborationRequestRevokedEmailTitle(props.organizationName);
  const txt = `
    ${getHeaderText(title)}
    -
    This is to notify you that the collaboration request sent from ${
      props.organizationName
    } has been revoked.
    `;

  return txt;
}
