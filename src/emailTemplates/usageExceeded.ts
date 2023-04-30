import {UsageRecordCategory} from '../definitions/usageRecord';
import {UsageThreshold} from '../definitions/workspace';
import {multilineTextToParagraph} from '../utils/fns';
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

export interface UsageExceededEmailProps extends BaseEmailTemplateProps {
  workspaceName: string;
  threshold: UsageThreshold;
}

export function usageExceededEmailHTML(props: UsageExceededEmailProps) {
  const title = getUsageExceededEmailTitle(props.workspaceName, props.threshold);
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
      ${getUsageExceededEmailMessage(props.workspaceName, props.threshold)}
    </p>
  `)}
  ${getLoginSectionHTML(props)}
  ${getFooterHTML()}
</body>
</html>
    `;
}

export function usageExceededEmailText(props: UsageExceededEmailProps) {
  const title = getUsageExceededEmailTitle(props.workspaceName, props.threshold);
  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
${getUsageExceededEmailMessage(props.workspaceName, props.threshold)}
${getLoginSectionText(props)}
  `;

  return txt;
}

export function getUsageExceededEmailMessage(workspaceName: string, threshold: UsageThreshold) {
  let message = '';
  switch (threshold.category) {
    case UsageRecordCategory.Storage:
      message = `You have reached your storage usage threshold for workspace ${workspaceName}.`;
      break;
    case UsageRecordCategory.BandwidthIn:
      message = `You have reached your incoming bandwidth usage threshold for workspace ${workspaceName}.`;
      break;
    case UsageRecordCategory.BandwidthOut:
      message = `You have reached your outgoing bandwidth usage threshold for workspace ${workspaceName}.`;
      break;
    // case UsageRecordCategory.Request:
    //   message = `You have reached your API requests usage threshold for workspace ${workspaceName}.`;
    //   break;
    default:
      message = `You have reached your ${threshold.category} usage threshold for workspace ${workspaceName}.`;
  }

  return multilineTextToParagraph(
    `${message} Limit was \$${threshold.budget}. 
    Further requests of this type will not be served. 
    Please login to your workspace to increase your usage thresholds.`
  );
}

export function getUsageExceededEmailTitle(workspaceName: string, threshold: UsageThreshold) {
  let message = '';
  switch (threshold.category) {
    case UsageRecordCategory.Storage:
      message = `Storage usage exceeded for workspace ${workspaceName}.`;
      break;
    case UsageRecordCategory.BandwidthIn:
      message = `Incoming bandwidth usage exceeded for workspace ${workspaceName}.`;
      break;
    case UsageRecordCategory.BandwidthOut:
      message = `Outgoing bandwidth usage exceeded for workspace ${workspaceName}.`;
      break;
    default:
      message = `${threshold.category} usage exceeded for workspace ${workspaceName}.`;
  }

  return message;
}
