import {IUser} from '../../../definitions/user';
import {getTimestamp} from '../../../utils/dateFns';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {userExtractor} from '../utils';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

const updateUser: UpdateUserEndpoint = async (context, instData) => {
  let user = await context.session.getUser(context, instData);
  const data = validate(instData.data, updateUserJoiSchema);
  const update: Partial<IUser> = {
    ...data,
    lastUpdatedAt: getTimestamp(),
  };

  if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
    update.isEmailVerified = false;
    update.emailVerifiedAt = null;
    update.emailVerificationEmailSentAt = null;
  }

  user = await context.semantic.user.getAndUpdateOneById(user.resourceId, update);
  const userWithWorkspaces = await populateUserWorkspaces(context, user);

  // Make the updated user data available to other requests made with this
  //  request data
  instData.user = user;
  return {user: userExtractor(userWithWorkspaces)};
};

export default updateUser;
