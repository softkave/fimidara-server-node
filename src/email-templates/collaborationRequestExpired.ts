import {
  emailTemplateStyles,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
} from './helpers';

export interface ICollaborationRequestExpiredEmailProps {
  organizationName: string;
}

export function collaborationRequestExpiredEmailHTML(
  props: ICollaborationRequestExpiredEmailProps
) {
  const title = `Collaboration Request from ${props.organizationName} Expired`;

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
            } has been expired.
        </p>
        <p>
        </p>
        ${getFooterHTML()}
    </body>
    </html>
    `;
}

export function collaborationRequestExpiredEmailText(
  props: ICollaborationRequestExpiredEmailProps
) {
  const title = `Collaboration Request from ${props.organizationName} Expired`;
  const txt = `
    ${getHeaderText(title)}
    -
    This is to notify you that the collaboration request sent from ${
      props.organizationName
    } has been expired.
    `;

  return txt;
}
