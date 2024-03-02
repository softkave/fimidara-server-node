import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler';
import {SignupEndpoint} from './types';
import {INTERNAL_signupUser} from './utils';
import {signupJoiSchema} from './validation';

const signup: SignupEndpoint = async instData => {
  const data = validate(instData.data, signupJoiSchema);
  const user = await kSemanticModels
    .utils()
    .withTxn(opts => INTERNAL_signupUser(data, {}, opts), /** reuseTxn */ false);
  const [userToken, clientAssignedToken] = await kSemanticModels
    .utils()
    .withTxn(
      opts =>
        Promise.all([
          getUserToken(user.resourceId, opts),
          getUserClientAssignedToken(user.resourceId, opts),
        ]),
      /** reuseTxn */ false
    );
  instData.agent = makeUserSessionAgent(user, userToken);
  await INTERNAL_sendEmailVerificationCode(user);
  return toLoginResult(user, userToken, clientAssignedToken);
};

export default signup;
