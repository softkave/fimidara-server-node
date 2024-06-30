import {
  emailHelperChars,
  emailTemplateStyles,
  getAccountAccessSectionHTML,
  getAccountAccessSectionText,
  getCenteredContentHTML,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
} from './helpers.js';
import {BaseEmailTemplateProps} from './types.js';

export interface CollaborationRequestRevokedEmailProps
  extends BaseEmailTemplateProps {
  workspaceName: string;
}

export const kCollaborationRequestRevokedEmail = {
  title: (workspaceName: string) => {
    return `Collaboration request from ${workspaceName} revoked`;
  },
};

export function collaborationRequestRevokedEmailHTML(
  props: CollaborationRequestRevokedEmailProps
) {
  const title = kCollaborationRequestRevokedEmail.title(props.workspaceName);
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
      This is to notify you that the collaboration request sent from <b>
      ${props.workspaceName}</b> has been revoked.
    </p>`)}
  ${getAccountAccessSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
`;
}

export function collaborationRequestRevokedEmailText(
  props: CollaborationRequestRevokedEmailProps
) {
  const title = kCollaborationRequestRevokedEmail.title(props.workspaceName);
  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
This is to notify you that the collaboration request sent from ${
    props.workspaceName
  } has been revoked.
${getAccountAccessSectionText(props)}
`;

  return txt;
}
