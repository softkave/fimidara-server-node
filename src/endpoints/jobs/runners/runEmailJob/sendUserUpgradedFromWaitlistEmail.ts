import {kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  UpgradedFromWaitlistEmailProps,
  kUpgradeFromWaitlistEmailArtifacts,
  upgradedFromWaitlistEmailHTML,
  upgradedFromWaitlistEmailText,
} from '../../../../emailTemplates/upgradedFromWaitlist.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getBaseEmailTemplateProps} from './utils.js';

export async function sendUserUpgradedFromWaitlistEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.upgradedFromWaitlist,
    `Email job type is not ${kEmailJobType.upgradedFromWaitlist}`
  );
  const {user, base, source} = await getBaseEmailTemplateProps(params);

  if (!user) {
    throw new Error(`User not found for job ${jobId}`);
  }

  const emailProps: UpgradedFromWaitlistEmailProps = {
    ...base,
    firstName: user.firstName,
  };
  const html = upgradedFromWaitlistEmailHTML(emailProps);
  const text = upgradedFromWaitlistEmailText(emailProps);
  return await kIjxUtils.email().sendEmail({
    source,
    subject: kUpgradeFromWaitlistEmailArtifacts.title,
    body: {html, text},
    destination: params.emailAddress,
  });
}
