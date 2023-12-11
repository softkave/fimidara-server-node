import {AppResourceTypeMap} from '../../../definitions/system';
import {
  UpgradedFromWaitlistEmailProps,
  upgradedFromWaitlistEmailHTML,
  upgradedFromWaitlistEmailText,
  upgradedFromWaitlistEmailTitle,
} from '../../../emailTemplates/upgradedFromWaitlist';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {UpgradeWaitlistedUsersEndpoint} from './types';
import {upgradeWaitlistedUsersJoiSchema} from './validation';

const upgradeWaitlistedUsers: UpgradeWaitlistedUsersEndpoint = async reqData => {
  const data = validate(reqData.data, upgradeWaitlistedUsersJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(reqData, [AppResourceTypeMap.User]);
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.utils().withTxn(opts => {
    return kSemanticModels
      .user()
      .getAndUpdateManyByQuery(
        {resourceId: {$in: data.userIds}},
        {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
        opts
      );
  });

  // TODO: fire and forget or send in a job. Do the same for other email send
  // calls
  await Promise.all(
    users.map(user =>
      sendUserUpgradedFromWaitlistEmail(user.email, {
        firstName: user.firstName,
        signupLink: kUtilsInjectables.config().clientSignupLink,
        loginLink: kUtilsInjectables.config().clientLoginLink,
      })
    )
  );
};

export default upgradeWaitlistedUsers;

async function sendUserUpgradedFromWaitlistEmail(
  emailAddress: string,
  props: UpgradedFromWaitlistEmailProps
) {
  const html = upgradedFromWaitlistEmailHTML(props);
  const text = upgradedFromWaitlistEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: upgradedFromWaitlistEmailTitle,
    body: {html, text},
    destination: [emailAddress],
    source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
  });
}
