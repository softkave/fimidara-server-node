import {CollaborationRequestResponse} from '../definitions/collaborationRequest';
import {
  emailTemplateStyles,
  getCenteredContentHTML,
  getFooterHTML,
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
  return `${props.recipientEmail} ${props.response} your collaboration request`;
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
    <p>
    ${getMessage(props)}
    </p>`)}
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
  const txt = `
${getHeaderText(title)}
-
${getMessage(props)}
${getLoginSectionText(props)}
`;

  return txt;
}
