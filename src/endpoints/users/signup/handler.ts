import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getLoginResult} from '../login/utils.js';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler.js';
import {SignupEndpoint} from './types.js';
import {INTERNAL_signupUser} from './utils.js';
import {signupJoiSchema} from './validation.js';

const signup: SignupEndpoint = async reqData => {
  const data = validate(reqData.data, signupJoiSchema);
  const user = await kIjxSemantic
    .utils()
    .withTxn(opts => INTERNAL_signupUser(data, {}, opts));

  kIjxUtils
    .promises()
    .callAndForget(() => INTERNAL_sendEmailVerificationCode(user));
  return await getLoginResult(user);
};

export default signup;
