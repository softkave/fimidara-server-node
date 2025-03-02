import * as argon2 from 'argon2';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidEmailOrPasswordError} from '../errors.js';
import {LoginEndpoint} from './types.js';
import {getLoginResult} from './utils.js';
import {loginJoiSchema} from './validation.js';

const login: LoginEndpoint = async reqData => {
  const data = validate(reqData.data, loginJoiSchema);
  const user = await kIjxSemantic.user().getByEmail(data.email);
  appAssert(user, new InvalidEmailOrPasswordError());

  const passwordMatch = await argon2.verify(user.hash, data.password);
  appAssert(passwordMatch, new InvalidEmailOrPasswordError());

  return await getLoginResult(user);
};

export default login;
