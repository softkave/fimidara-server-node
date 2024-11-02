import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {validate} from '../../../utils/validate.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {assertUserIsPartOfRootWorkspace} from '../utils.js';
import {UpgradeWaitlistedUsersEndpoint} from './types.js';
import {upgradeWaitlistedUsersJoiSchema} from './validation.js';

const upgradeWaitlistedUsers: UpgradeWaitlistedUsersEndpoint =
  async reqData => {
    const data = validate(reqData.data, upgradeWaitlistedUsersJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentType.user,
        kSessionUtils.accessScope.user
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
      const userList = await kSemanticModels.user().getManyByQuery(
        {resourceId: {$in: data.userIds}},
        {
          ...opts,
          projection: {email: true, firstName: true, resourceId: true},
        }
      );
      return userList as Array<
        Pick<User, 'email' | 'firstName' | 'resourceId'>
      >;
    });

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
