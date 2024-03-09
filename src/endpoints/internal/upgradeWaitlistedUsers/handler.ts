import {EmailJobParams, kEmailJobType, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {User} from '../../../definitions/user';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {queueJobs} from '../../jobs/queueJobs';
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
    .getAgent(reqData, [kFimidaraResourceType.User]);
  await assertUserIsPartOfRootWorkspace(agent);
  const users = await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .user()
      .updateManyByQuery(
        {resourceId: {$in: data.userIds}},
        {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
        opts
      );
    const userList = await kSemanticModels
      .user()
      .getManyByQuery(
        {resourceId: {$in: data.userIds}},
        {...opts, projection: {email: true, firstName: true, resourceId: true}}
      );
    return userList as Array<Pick<User, 'email' | 'firstName' | 'resourceId'>>;
  }, /** reuseTxn */ false);

  users.map(user => {
    kUtilsInjectables.promises().forget(
      queueJobs<EmailJobParams>(
        /** workspace ID */ undefined,
        /** parent job ID */ undefined,
        {
          createdBy: agent,
          type: kJobType.email,
          params: {
            type: kEmailJobType.upgradedFromWaitlist,
            emailAddress: [user.email],
            userId: [user.resourceId],
          },
        }
      )
    );
  });
};

export default upgradeWaitlistedUsers;
