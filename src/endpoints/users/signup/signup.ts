import {makeUserSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils.js';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler.js';
import {SignupEndpoint} from './types.js';
import {INTERNAL_signupUser} from './utils.js';
import {signupJoiSchema} from './validation.js';

const signup: SignupEndpoint = async reqData => {
  const data = validate(reqData.data, signupJoiSchema);
  const user = await kSemanticModels
    .utils()
    .withTxn(opts => INTERNAL_signupUser(data, {}, opts));
  const [userToken, clientAssignedToken] = await kSemanticModels
    .utils()
    .withTxn(opts =>
      Promise.all([
        getUserToken(user.resourceId, opts),
        getUserClientAssignedToken(user.resourceId, opts),
      ])
    );
  reqData.agent = makeUserSessionAgent(user, userToken);
  await INTERNAL_sendEmailVerificationCode(user);
  return toLoginResult(user, userToken, clientAssignedToken);
};

export default signup;
