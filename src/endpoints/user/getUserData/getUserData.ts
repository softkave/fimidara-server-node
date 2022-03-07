import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils';
import {GetUserDataEndpoint} from './types';

/**
 * getUserData. Ensure that:
 * - User is returned from the token present or throw error otherwise
 */

const getUserData: GetUserDataEndpoint = async (context, instData) => {
  const user = await context.session.getUser(context, instData);
  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default getUserData;
