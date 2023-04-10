import {
  emailTemplateStyles,
  getCenteredContentHTML,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
  getLoginSectionHTML,
  getLoginSectionText,
} from './helpers';
import {IBaseEmailTemplateProps} from './types';

export interface ICollaborationRequestExpiredEmailProps
  extends IBaseEmailTemplateProps {
  workspaceName: string;
}

function getTitle(props: ICollaborationRequestExpiredEmailProps) {
  return `Collaboration request from ${props.workspaceName} expired`;
}

export function collaborationRequestExpiredEmailHTML(
  props: ICollaborationRequestExpiredEmailProps
) {
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
  <p>
    This is to notify you that the collaboration request sent from ${props.workspaceName} has been expired.
  </p>`)}
  ${getLoginSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
`;
}

export function collaborationRequestExpiredEmailText(
  props: ICollaborationRequestExpiredEmailProps
) {
  const title = getTitle(props);
  const txt = `
${getHeaderText(title)}
-
This is to notify you that the collaboration request sent from ${
    props.workspaceName
  } has been expired.
  ${getLoginSectionText(props)}
`;

  return txt;
}
