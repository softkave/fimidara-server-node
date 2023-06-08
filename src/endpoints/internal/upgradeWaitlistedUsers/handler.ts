import {AppResourceType} from '../../../definitions/system';
import {
  UpgradedFromWaitlistEmailProps,
  upgradedFromWaitlistEmailHTML,
  upgradedFromWaitlistEmailText,
  upgradedFromWaitlistEmailTitle,
} from '../../../emailTemplates/upgradedFromWaitlist';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {UpgradeWaitlistedUsersEndpoint} from './types';
import {upgradeWaitlistedUsersJoiSchema} from './validation';

const upgradeWaitlistedUsers: UpgradeWaitlistedUsersEndpoint = async (context, reqData) => {
  const data = validate(reqData.data, upgradeWaitlistedUsersJoiSchema);
  const agent = await context.session.getAgent(context, reqData, [AppResourceType.User]);
  await assertUserIsPartOfRootWorkspace(context, agent);
  const users = await executeWithMutationRunOptions(context, opts => {
    return context.semantic.user.updateManyByQuery(
      {resourceId: {$in: data.userIds}},
      {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
      opts
    );
  });

  // TODO: fire and forget or send in a job. Do the same for other email send
  // calls
  await Promise.all(
    users.map(user =>
      sendUserUpgradedFromWaitlistEmail(context, user.email, {
        firstName: user.firstName,
        signupLink: context.appVariables.clientSignupLink,
        loginLink: context.appVariables.clientLoginLink,
      })
    )
  );
};

export default upgradeWaitlistedUsers;

async function sendUserUpgradedFromWaitlistEmail(
  ctx: BaseContextType,
  emailAddress: string,
  props: UpgradedFromWaitlistEmailProps
) {
  const html = upgradedFromWaitlistEmailHTML(props);
  const text = upgradedFromWaitlistEmailText(props);
  await ctx.email.sendEmail(ctx, {
    subject: upgradedFromWaitlistEmailTitle,
    body: {html, text},
    destination: [emailAddress],
    source: ctx.appVariables.appDefaultEmailAddressFrom,
  });
}
