import * as argon2 from 'argon2';
import {validate} from '../../../utils/validate.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {InvalidEmailOrPasswordError} from '../errors.js';
import {LoginEndpoint} from './types.js';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from './utils.js';
import {loginJoiSchema} from './validation.js';

const login: LoginEndpoint = async reqData => {
  const data = validate(reqData.data, loginJoiSchema);
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
