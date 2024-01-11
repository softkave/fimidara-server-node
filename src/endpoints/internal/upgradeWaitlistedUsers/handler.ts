import {kAppResourceType} from '../../../definitions/system';
import {
  UpgradedFromWaitlistEmailProps,
  kUpgradeFromWaitlistEmailArtifacts,
  upgradedFromWaitlistEmailHTML,
  upgradedFromWaitlistEmailText,
} from '../../../emailTemplates/upgradedFromWaitlist';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {UpgradeWaitlistedUsersEndpoint} from './types';
import {upgradeWaitlistedUsersJoiSchema} from './validation';

const upgradeWaitlistedUsers: UpgradeWaitlistedUsersEndpoint = async reqData => {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.clientLoginLink);
  appAssert(suppliedConfig.clientSignupLink);

  const data = validate(reqData.data, upgradeWaitlistedUsersJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(reqData, [kAppResourceType.User]);
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
    users.map(user => {
      return sendUserUpgradedFromWaitlistEmail(user.email, {
        firstName: user.firstName,
        signupLink: suppliedConfig.clientSignupLink!,
        loginLink: suppliedConfig.clientLoginLink!,
      });
    })
  );
};

export default upgradeWaitlistedUsers;

async function sendUserUpgradedFromWaitlistEmail(
  emailAddress: string,
  props: UpgradedFromWaitlistEmailProps
) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  appAssert(suppliedConfig.appDefaultEmailAddressFrom);

  const html = upgradedFromWaitlistEmailHTML(props);
  const text = upgradedFromWaitlistEmailText(props);
  await kUtilsInjectables.email().sendEmail({
    subject: kUpgradeFromWaitlistEmailArtifacts.title,
    body: {html, text},
    destination: [emailAddress],
    source: suppliedConfig.appDefaultEmailAddressFrom,
  });
}
