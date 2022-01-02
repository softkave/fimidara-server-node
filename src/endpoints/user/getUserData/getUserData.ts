import {userExtractor} from '../utils';
import {GetUserDataEndpoint} from './types';

/**
 * getUserData. Ensure that:
 * - User is returned from the token present or throw error otherwise
 */

const getUserData: GetUserDataEndpoint = async (context, instData) => {
  const user = await context.session.getUser(context, instData);
  return {
    user: userExtractor(user),
  };
};

export default getUserData;
