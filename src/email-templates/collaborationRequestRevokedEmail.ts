import {getFooterHTML, getHeaderHTML, getHeaderText} from './helpers';

export interface ICollaborationRequestRevokedEmailProps {
  organizationName: string;
}

export function collaborationRequestRevokedEmailHTML(
  props: ICollaborationRequestRevokedEmailProps
) {
  const title = `Collaboration Request from ${props.organizationName} Revoked`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <title>${getHeaderText(title)}</title>
        <style>
        </style>
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
  const title = `Collaboration Request from ${props.organizationName} Revoked`;
  const txt = `
    ${getHeaderText(title)}

    This is to notify you that the collaboration request sent from ${
      props.organizationName
    } has been revoked.
    `;

  return txt;
}
