import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';
import UserQueries from '../UserQueries';
import {userExtractor} from '../utils';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

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

  user = await withUserOrganizations(
    context,
    await context.data.user.assertUpdateItem(
      UserQueries.getById(user.resourceId),
      update
    )
  );

  // Make the updated user data available to other requests
  //  made with this request data
  instData.user = user;
  return {
    user: userExtractor(user),
  };
};

export default updateUser;
