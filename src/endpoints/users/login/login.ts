import * as argon2 from 'argon2';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {InvalidEmailOrPasswordError} from '../errors';
import {LoginEndpoint} from './types';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from './utils';
import {loginJoiSchema} from './validation';
import {kSemanticModels} from '../../contexts/injectables';

const login: LoginEndpoint = async instData => {
  const data = validate(instData.data, loginJoiSchema);
  const user = await kSemanticModels.user().getByEmail(data.email);

  if (!user) {
    throw new InvalidEmailOrPasswordError();
  }

  const passwordMatch = await argon2.verify(user.hash, data.password);

  if (!passwordMatch) {
    throw new InvalidEmailOrPasswordError();
  }

  const [userToken, clientAssignedToken] = await kSemanticModels
    .utils()
    .withTxn(opts =>
      Promise.all([
        getUserToken(user.resourceId, opts),
        getUserClientAssignedToken(user.resourceId, opts),
      ])
    );
  const userWithWorkspaces = await populateUserWorkspaces(user);
  return toLoginResult(userWithWorkspaces, userToken, clientAssignedToken);
};

export default login;
