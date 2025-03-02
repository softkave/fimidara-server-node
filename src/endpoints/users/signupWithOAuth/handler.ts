import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getLoginResult} from '../login/utils.js';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler.js';
import {SignupWithOAuthEndpoint} from './types.js';
import {INTERNAL_signupUserWithOAuth} from './utils.js';
import {signupWithOAuthJoiSchema} from './validation.js';

const signupWithOAuth: SignupWithOAuthEndpoint = async reqData => {
  const data = validate(reqData.data, signupWithOAuthJoiSchema);
  const user = await kIjxSemantic
    .utils()
    .withTxn(opts => INTERNAL_signupUserWithOAuth({data, opts}));

  if (!data.emailVerifiedAt && !user.emailVerifiedAt) {
    kIjxUtils
      .promises()
      .callAndForget(() => INTERNAL_sendEmailVerificationCode(user));
  }

  return await getLoginResult(user);
};

export default signupWithOAuth;
