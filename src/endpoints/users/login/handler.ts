import * as argon2 from 'argon2';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidEmailOrPasswordError} from '../errors.js';
import {LoginEndpoint} from './types.js';
import {getLoginResult} from './utils.js';
import {loginJoiSchema} from './validation.js';

const login: LoginEndpoint = async reqData => {
  const data = validate(reqData.data, loginJoiSchema);
  const user = await kSemanticModels.user().getByEmail(data.email);
  appAssert(user, new InvalidEmailOrPasswordError());

  const passwordMatch = await argon2.verify(user.hash, data.password);
  appAssert(passwordMatch, new InvalidEmailOrPasswordError());

  return await getLoginResult(user);
};

export default login;
