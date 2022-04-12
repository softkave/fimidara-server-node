import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {withUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {makeUserSessionAgent} from '../../contexts/SessionContext';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import {ChangePasswordEndpoint} from './types';
import {changePasswordJoiSchema} from './validation';

const changePassword: ChangePasswordEndpoint = async (context, instData) => {
  const result = validate(instData.data, changePasswordJoiSchema);
  const newPassword = result.password;
  let user = await context.session.getUser(context, instData);
  const hash = await argon2.hash(newPassword);
  user = await withUserWorkspaces(
    context,
    await context.data.user.assertUpdateItem(
      UserQueries.getById(user.resourceId),
      {
        hash,
        passwordLastChangedAt: getDateString(),
      }
    )
  );

  // Allow other endpoints called with this request to use the updated user data
  instData.user = user;

  // Delete user token and incomingTokenData since they are no longer valid
  delete instData.agent?.userToken;
  delete instData.incomingTokenData;

  // Delete existing user tokens cause they're no longer valid
  await context.data.userToken.deleteManyItems(
    UserTokenQueries.getByUserId(user.resourceId)
  );

  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  // Allow other endpoints called with this request to use the updated user token
  instData.agent = makeUserSessionAgent(userToken, user);
  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default changePassword;
