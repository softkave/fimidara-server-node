import {CollaborationRequestResponse} from '../definitions/collaborationRequest.js';
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
} from './helpers.js';
import {BaseEmailTemplateProps} from './types.js';

export interface CollaborationRequestResponseEmailProps
  extends BaseEmailTemplateProps {
  workspaceName: string;
  recipientEmail: string;
  response: CollaborationRequestResponse;
}

export const kCollaborationRequestResponseArtifacts = {
  title: (
    props: Pick<
      CollaborationRequestResponseEmailProps,
      'workspaceName' | 'response'
    >
  ) => {
    return `Collaboration request ${props.response} on ${props.workspaceName}`;
  },
  message: (props: CollaborationRequestResponseEmailProps) => {
    return `This is to notify you that the collaboration request sent to ${props.recipientEmail} to join the workspace ${props.workspaceName} has been ${props.response}`;
  },
};

export function collaborationRequestResponseEmailHTML(
  props: CollaborationRequestResponseEmailProps
) {
  const title = kCollaborationRequestResponseArtifacts.title(props);
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
      ${kCollaborationRequestResponseArtifacts.message(props)}
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
  const title = kCollaborationRequestResponseArtifacts.title(props);
  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
${kCollaborationRequestResponseArtifacts.message(props)}
${getLoginSectionText(props)}
`;

  return txt;
}
