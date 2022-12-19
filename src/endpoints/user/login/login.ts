import * as argon2 from 'argon2';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {makeUserSessionAgent} from '../../contexts/SessionContext';
import {InvalidEmailOrPasswordError} from '../errors';
import UserQueries from '../UserQueries';
import {LoginEndpoint} from './types';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from './utils';
import {loginJoiSchema} from './validation';

const login: LoginEndpoint = async (context, instData) => {
  const data = validate(instData.data, loginJoiSchema);
  const user = await context.data.user.getItem(
    UserQueries.getByEmail(data.email)
  );

  if (!user) {
    throw new InvalidEmailOrPasswordError();
  }

  let passwordMatch = false;
  passwordMatch = await argon2.verify(user.hash, data.password);
  if (!passwordMatch) {
    throw new InvalidEmailOrPasswordError();
  }

  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  const userWithWorkspaces = await populateUserWorkspaces(context, user);

  // Make the user token available to other requests
  // made with this request data
  instData.agent = makeUserSessionAgent(userToken, userWithWorkspaces);
  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default login;
