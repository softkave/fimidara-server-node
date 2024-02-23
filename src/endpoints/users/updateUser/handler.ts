import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {isStringEqual} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {assertEmailAddressAvailable, assertUser, userExtractor} from '../utils';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

const updateUser: UpdateUserEndpoint = async instData => {
  let user = await kUtilsInjectables.session().getUser(instData);
  const data = validate(instData.data, updateUserJoiSchema);
  const update: Partial<User> = {
    ...data,
    lastUpdatedAt: getTimestamp(),
  };

  if (data.email && !isStringEqual(data.email, user.email)) {
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

  const userWithWorkspaces = await populateUserWorkspaces(user);

  // Make the updated user data available to other requests made with this
  //  request data
  instData.user = user;
  return {user: userExtractor(userWithWorkspaces)};
};

export default updateUser;
