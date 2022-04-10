import * as argon2 from 'argon2';
import {ServerError} from '../../../utilities/errors';
import {validate} from '../../../utilities/validate';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';
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

  try {
    passwordMatch = await argon2.verify(user.hash, data.password);
  } catch (error) {
    console.error(error);
    throw new ServerError();
  }

  if (!passwordMatch) {
    throw new InvalidEmailOrPasswordError();
  }

  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  const userWithOrgs = await withUserOrganizations(context, user);

  // Make the user token available to other requests
  // made with this request data
  instData.agent = makeUserSessionAgent(userToken, userWithOrgs);
  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default login;
