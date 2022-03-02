import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import UserQueries from '../UserQueries';
import {userExtractor} from '../utils';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

/**
 * Requirements. Ensure that:
 * - User data is updated
 * - Email verification is voided if user email was updated
 */

const updateUser: UpdateUserEndpoint = async (context, instData) => {
  let user = await context.session.getUser(context, instData);
  const data = validate(instData.data, updateUserJoiSchema);
  const update: Partial<IUser> = {
    ...data,
    lastUpdatedAt: getDateString(),
  };

  if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
    update.isEmailVerified = false;
    update.emailVerifiedAt = null;
    update.emailVerificationEmailSentAt = null;
  }

  user = await context.data.user.assertUpdateItem(
    UserQueries.getById(user.resourceId),
    update
  );

  // Make the updated user data available to other requests made with this request data
  instData.user = user;
  return {
    user: userExtractor(user),
  };
};

export default updateUser;
