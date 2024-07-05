import {kUsageRecordCategory} from '../definitions/usageRecord.js';
import {UsageThreshold} from '../definitions/workspace.js';
import {multilineTextToParagraph} from '../utils/fns.js';
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

export interface UsageExceededEmailProps extends BaseEmailTemplateProps {
  workspaceName: string;
  threshold: UsageThreshold;
}

export const kUsageExceededEmailArtifacts = {
  title: (workspaceName: string, threshold: UsageThreshold) => {
    let message = '';
    switch (threshold.category) {
      case kUsageRecordCategory.storage:
        message = `Storage usage exceeded for workspace "${workspaceName}"`;
        break;
      case kUsageRecordCategory.bandwidthIn:
        message = `Incoming bandwidth usage exceeded for workspace "${workspaceName}"`;
        break;
      case kUsageRecordCategory.bandwidthOut:
        message = `Outgoing bandwidth usage exceeded for workspace "${workspaceName}"`;
        break;
      default:
        message = `${threshold.category} usage exceeded for workspace "${workspaceName}"`;
    }

    return message;
  },
};

export function usageExceededEmailHTML(props: UsageExceededEmailProps) {
  const title = kUsageExceededEmailArtifacts.title(
    props.workspaceName,
    props.threshold
  );
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
  const title = kUsageExceededEmailArtifacts.title(
    props.workspaceName,
    props.threshold
  );
  const txt = `${getHeaderText(title)}
${emailHelperChars.emDash}
${getGreetingText(props)}
${getUsageExceededEmailMessage(props.workspaceName, props.threshold)}
${getLoginSectionText(props)}
  `;

  return txt;
}

export function getUsageExceededEmailMessage(
  workspaceName: string,
  threshold: UsageThreshold
) {
  let message = '';
  switch (threshold.category) {
    case kUsageRecordCategory.storage:
      message = `You have reached your storage usage threshold for workspace "${workspaceName}"`;
      break;
    case kUsageRecordCategory.bandwidthIn:
      message = `You have reached your incoming bandwidth usage threshold for workspace "${workspaceName}"`;
      break;
    case kUsageRecordCategory.bandwidthOut:
      message = `You have reached your outgoing bandwidth usage threshold for workspace "${workspaceName}"`;
      break;
    // case UsageRecordCategoryMap.Request:
    //   message = `You have reached your API requests usage threshold for workspace "${workspaceName}"`
    //   break;
    default:
      message = `You have reached your ${threshold.category} usage threshold for workspace "${workspaceName}"`;
  }

  return multilineTextToParagraph(
    `${message}. Limit was $${threshold.budget}. 
    Further requests of this type will not be served. 
    Please login to your workspace to increase your usage thresholds.`
  );
}
