import {User} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {assertEmailAddressAvailable, assertUser, userExtractor} from '../utils';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

const updateUser: UpdateUserEndpoint = async (context, instData) => {
  let user = await context.session.getUser(context, instData);
  const data = validate(instData.data, updateUserJoiSchema);
  const update: Partial<User> = {
    ...data,
    lastUpdatedAt: getTimestamp(),
  };

  if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
    await assertEmailAddressAvailable(context, data.email);
    update.isEmailVerified = false;
    update.emailVerifiedAt = null;
    update.emailVerificationEmailSentAt = null;
  }

  user = await context.semantic.utils.withTxn(context, async opts => {
    const updatedUser = await context.semantic.user.getAndUpdateOneById(
      user.resourceId,
      update,
      opts
    );
    assertUser(updatedUser);
    return updatedUser;
  });

  const userWithWorkspaces = await populateUserWorkspaces(context, user);

  // Make the updated user data available to other requests made with this
  //  request data
  instData.user = user;
  return {user: userExtractor(userWithWorkspaces)};
};

export default updateUser;
