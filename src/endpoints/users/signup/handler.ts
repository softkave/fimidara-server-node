import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getLoginResult} from '../login/utils.js';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler.js';
import {SignupEndpoint} from './types.js';
import {INTERNAL_signupUser} from './utils.js';
import {signupJoiSchema} from './validation.js';

const signup: SignupEndpoint = async reqData => {
  const data = validate(reqData.data, signupJoiSchema);
  const user = await kSemanticModels
    .utils()
    .withTxn(opts => INTERNAL_signupUser(data, {}, opts));

  kUtilsInjectables.promises().forget(INTERNAL_sendEmailVerificationCode(user));
  return await getLoginResult(user);
};

export default signup;
