import * as argon2 from 'argon2';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {InvalidEmailOrPasswordError} from '../errors';
import {LoginEndpoint} from './types';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from './utils';
import {loginJoiSchema} from './validation';

const login: LoginEndpoint = async (context, instData) => {
  const data = validate(instData.data, loginJoiSchema);
  const user = await context.semantic.user.getByEmail(data.email);
  if (!user) {
    throw new InvalidEmailOrPasswordError();
  }

  const passwordMatch = await argon2.verify(user.hash, data.password);
  if (!passwordMatch) {
    throw new InvalidEmailOrPasswordError();
  }

  const [userToken, clientAssignedToken, userWithWorkspaces] = await Promise.all([
    getUserToken(context, user.resourceId),
    getUserClientAssignedToken(context, user.resourceId),
    populateUserWorkspaces(context, user),
  ]);
  return toLoginResult(context, userWithWorkspaces, userToken, clientAssignedToken);
};

export default login;
