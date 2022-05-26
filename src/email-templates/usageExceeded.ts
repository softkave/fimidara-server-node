import {UsageRecordCategory} from '../definitions/usageRecord';
import {
  emailTemplateStyles,
  getCenteredContentHTML,
  getFooterHTML,
  getHeaderHTML,
  getHeaderText,
  getLoginSectionHTML,
  getLoginSectionText,
} from './helpers';

export interface IUsageExceededEmailProps {
  loginLink: string;
  workspaceName: string;
  message: string;
}

export function usageExceededEmailTitle(workspaceName: string) {
  return `Usage Exceeded in ${workspaceName}`;
}

export function usageExceededEmailHTML(props: IUsageExceededEmailProps) {
  const title = usageExceededEmailTitle(props.workspaceName);
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
    ${props.message}
  </p>
  `)}
  ${getLoginSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
    `;
}

export function usageExceededEmailText(props: IUsageExceededEmailProps) {
  const title = usageExceededEmailTitle(props.workspaceName);
  const txt = `
${getHeaderText(title)}
-
${props.message}
-
${getLoginSectionText(props)}
  `;

  return txt;
}

export function getLabelUsageExceededMessage(label: UsageRecordCategory) {
  let message = '';
  switch (label) {
    case UsageRecordCategory.Storage:
      message = `You have reached your storage usage threshold.`;
      break;
    case UsageRecordCategory.BandwidthIn:
      message = `You have reached your incoming bandwidth usage threshold.`;
      break;
    case UsageRecordCategory.BandwidthOut:
      message = `You have reached your outgoing bandwidth usage threshold.`;
      break;
    case UsageRecordCategory.Request:
      message = `You have reached your API requests usage threshold.`;
      break;
    default:
      message = `You have reached your ${label} usage threshold.`;
  }

  return `${message}. Further requests of this type will not be served. Please login to your workspace to increase your usage.`;
}

export function getTotalUsageExceededMessage(usage: number) {}
