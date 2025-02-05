import {CollaborationRequestResponse} from '../definitions/collaborationRequest.js';
import {
  emailHelperChars,
  emailTemplateStyles,
  getBoldText,
  getCenteredContentHTML,
  getFooterHTML,
  getGreetingHTML,
  getGreetingText,
  getHeaderHTML,
  getHeaderText,
  getItalicText,
  getLoginSectionHTML,
  getLoginSectionText,
} from './helpers.js';
import {BaseEmailTemplateProps, EmailMode} from './types.js';

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
    return `Collaboration request ${props.response} on "${props.workspaceName}"`;
  },
  message: (
    props: CollaborationRequestResponseEmailProps & {mode: EmailMode}
  ) => {
    return (
      'This is to notify you that the collaboration request sent to ' +
      `${getItalicText({text: props.recipientEmail, mode: props.mode})} ` +
      'to join the workspace ' +
      `${getBoldText({text: props.workspaceName, mode: props.mode})} ` +
      `has been ${getBoldText({text: props.response, mode: props.mode})}.`
    );
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
      ${kCollaborationRequestResponseArtifacts.message({
        ...props,
        mode: 'html',
      })}
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
${kCollaborationRequestResponseArtifacts.message({
  ...props,
  mode: 'text',
})}
${getLoginSectionText(props)}
`;

  return txt;
}
