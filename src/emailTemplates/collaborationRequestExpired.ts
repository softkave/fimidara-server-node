import {
  emailHelperChars,
  emailTemplateStyles,
  getCenteredContentHTML,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
  getLoginSectionHTML,
  getLoginSectionText,
} from './helpers';
import {BaseEmailTemplateProps} from './types';

export interface CollaborationRequestExpiredEmailProps extends BaseEmailTemplateProps {
  workspaceName: string;
}

function getTitle(props: CollaborationRequestExpiredEmailProps) {
  return `Collaboration request from ${props.workspaceName} expired`;
}

export function collaborationRequestExpiredEmailHTML(props: CollaborationRequestExpiredEmailProps) {
  const title = getTitle(props);
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
      This is to notify you that the collaboration request sent from ${
        props.workspaceName
      } has been expired.
    </p>`)}
  ${getLoginSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
`;
}

export function collaborationRequestExpiredEmailText(props: CollaborationRequestExpiredEmailProps) {
  const title = getTitle(props);
  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
This is to notify you that the collaboration request sent from ${
    props.workspaceName
  } has been expired.
  ${getLoginSectionText(props)}
`;

  return txt;
}
