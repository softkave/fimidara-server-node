import {CollaborationRequestResponse} from '../definitions/collaborationRequest';
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

export interface CollaborationRequestResponseEmailProps extends BaseEmailTemplateProps {
  workspaceName: string;
  recipientEmail: string;
  response: CollaborationRequestResponse;
}

export function collaborationRequestResponseEmailTitle(
  props: CollaborationRequestResponseEmailProps
) {
  return `Collaboration request ${props.response} on ${props.workspaceName}`;
}

function getMessage(props: CollaborationRequestResponseEmailProps) {
  return `This is to notify you that the collaboration request sent to ${props.recipientEmail} to join the workspace ${props.workspaceName} has been ${props.response}.`;
}

export function collaborationRequestResponseEmailHTML(
  props: CollaborationRequestResponseEmailProps
) {
  const title = collaborationRequestResponseEmailTitle(props);
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
      ${getMessage(props)}
      </p>
    `)}
  ${getLoginSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
`;
}

export function collaborationRequestResponseEmailText(
  props: CollaborationRequestResponseEmailProps
) {
  const title = collaborationRequestResponseEmailTitle(props);
  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
${getMessage(props)}
${getLoginSectionText(props)}
`;

  return txt;
}
