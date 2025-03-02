import assert from 'assert';
import {kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {EmailJobParams, kEmailJobType} from '../../../../definitions/job.js';
import {
  NewSignupsOnWaitlistEmailProps,
  kNewSignupsOnWaitlistEmailArtifacts,
  newSignupsOnWaitlistEmailHTML,
  newSignupsOnWaitlistEmailText,
} from '../../../../emailTemplates/newSignupsOnWaitlist.js';
import {appAssert} from '../../../../utils/assertion.js';
import {getBaseEmailTemplateProps} from './utils.js';

export async function sendNewSignupsOnWaitlistEmail(
  jobId: string,
  params: EmailJobParams
) {
  appAssert(
    params.type === kEmailJobType.newSignupsOnWaitlist,
    `Email job type is not ${kEmailJobType.newSignupsOnWaitlist}`
  );

  const {upgradeWaitlistLink} = kIjxUtils.suppliedConfig();
  assert(upgradeWaitlistLink, 'upgradeWaitlistLink not present');

  const {user, base, source} = await getBaseEmailTemplateProps(params);
  const emailProps: NewSignupsOnWaitlistEmailProps = {
    ...base,
    firstName: user?.firstName,
    count: params.params.count,
    upgradeWaitlistURL: upgradeWaitlistLink,
  };

  const html = newSignupsOnWaitlistEmailHTML(emailProps);
  const text = newSignupsOnWaitlistEmailText(emailProps);

  return await kIjxUtils.email().sendEmail({
    source,
    subject: kNewSignupsOnWaitlistEmailArtifacts.title(emailProps.count),
    body: {html, text},
    destination: params.emailAddress,
  });
}
