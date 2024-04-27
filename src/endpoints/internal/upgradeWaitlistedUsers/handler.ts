import {EmailJobParams, kEmailJobType, kJobType} from '../../../definitions/job';
import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {queueJobs} from '../../jobs/queueJobs';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {UpgradeWaitlistedUsersEndpoint} from './types';
import {upgradeWaitlistedUsersJoiSchema} from './validation';

const upgradeWaitlistedUsers: UpgradeWaitlistedUsersEndpoint = async reqData => {
  const data = validate(reqData.data, upgradeWaitlistedUsersJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
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
      // queueEmailMessage(
      //   user.email,
      //   {type: kEmailMessageType.upgradedFromWaitlist, params: {}},
      //   undefined,
      //   user.resourceId,
      //   {reuseTxn: false}
      // )

      queueJobs<EmailJobParams>(
        /** workspace ID */ undefined,
        /** parent job ID */ undefined,
        {
          createdBy: agent,
          type: kJobType.email,
          idempotencyToken: Date.now().toString(),
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
