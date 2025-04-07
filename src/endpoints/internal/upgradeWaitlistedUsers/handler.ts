import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
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
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.user,
        kSessionUtils.accessScopes.user
      );
    await assertUserIsPartOfRootWorkspace(agent);
    const users = await kIjxSemantic.utils().withTxn(async opts => {
      await kIjxSemantic
        .user()
        .updateManyByQuery(
          {resourceId: {$in: data.userIds}},
          {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
          opts
        );
      const userList = await kIjxSemantic.user().getManyByQuery(
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
      kIjxUtils.promises().callAndForget(() =>
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
