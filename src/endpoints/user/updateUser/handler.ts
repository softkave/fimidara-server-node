import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import UserQueries from '../UserQueries';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

const updateUser: UpdateUserEndpoint = async (context, instData) => {
  let user = await context.session.getUser(context, instData);
  const data = validate(instData.data, updateUserJoiSchema);
  const update: Partial<IUser> = {
    ...data,
    lastUpdatedAt: getDateString(),
  };

  if (data.email) {
    update.isEmailVerified = false;
    update.emailVerifiedAt = null;
    update.emailVerificationEmailSentAt = null;
  }

  user = await context.data.user.assertUpdateItem(
    UserQueries.getById(user.userId),
    update
  );

  // Make the updated user data available to other requests made with this request data
  instData.user = user;
};

export default updateUser;
