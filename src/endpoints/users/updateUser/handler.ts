import assert from 'assert';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {isStringEqual} from '../../../utils/fns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  assertUser,
  checkEmailAddressAvailability,
  userExtractor,
} from '../utils.js';
import {getUserFromSessionAgent} from '../utils/getUserFromSessionAgent.js';
import {UpdateUserEndpoint} from './types.js';
import {updateUserJoiSchema} from './validation.js';

const updateUserEndpoint: UpdateUserEndpoint = async reqData => {
  const data = validate(reqData.data, updateUserJoiSchema);
  const {workspace, workspaceId, agent} = await initEndpoint(reqData);

  const user = await kSemanticModels.utils().withTxn(async opts => {
    const user = await getUserFromSessionAgent(
      agent,
      /** params */ {
        workspaceId,
        userId: data.userId,
        action: kFimidaraPermissionActions.updateUser,
      },
      opts
    );

    const input = data.user;
    const update: Partial<User> = {
      ...input,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const isEmailAddressUpdated =
      input.email && !isStringEqual(input.email, user.email);

    if (input.email && isEmailAddressUpdated) {
      await checkEmailAddressAvailability({
        workspaceId: workspace.resourceId,
        email: input.email,
      });

      update.isEmailVerified = false;
      update.emailVerifiedAt = null;
      update.emailVerificationEmailSentAt = null;
    }

    assert.ok(user);
    const updatedUser = await kSemanticModels
      .user()
      .getAndUpdateOneById(user.resourceId, update, opts);

    assertUser(updatedUser);
    return updatedUser;
  });

  // make the updated user available to other requests made with this
  // RequestData
  reqData.user = user;
  return {user: userExtractor(user)};
};

export default updateUserEndpoint;
