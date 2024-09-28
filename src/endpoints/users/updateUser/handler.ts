import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {User} from '../../../definitions/user.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {isStringEqual} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler.js';
import {
  assertEmailAddressAvailable,
  assertUser,
  userExtractor,
} from '../utils.js';
import {UpdateUserEndpoint} from './types.js';
import {updateUserJoiSchema} from './validation.js';

const updateUser: UpdateUserEndpoint = async reqData => {
  let user = await kUtilsInjectables
    .session()
    .getUser(reqData, kSessionUtils.accessScopes.user);
  const data = validate(reqData.data, updateUserJoiSchema);
  const update: Partial<User> = {...data, lastUpdatedAt: getTimestamp()};
  const isEmailAddressUpdated =
    data.email && !isStringEqual(data.email, user.email);

  if (data.email && isEmailAddressUpdated) {
    await assertEmailAddressAvailable(data.email);
    update.isEmailVerified = false;
    update.emailVerifiedAt = null;
    update.emailVerificationEmailSentAt = null;
  }

  user = await kSemanticModels.utils().withTxn(async opts => {
    const updatedUser = await kSemanticModels
      .user()
      .getAndUpdateOneById(user.resourceId, update, opts);
    assertUser(updatedUser);
    return updatedUser;
  });

  if (isEmailAddressUpdated) {
    kUtilsInjectables
      .promises()
      .forget(INTERNAL_sendEmailVerificationCode(user));
  }

  const userWithWorkspaces = await populateUserWorkspaces(user);

  // Make the updated user data available to other requests made with this
  //  request data
  reqData.user = user;
  return {user: userExtractor(userWithWorkspaces)};
};

export default updateUser;
