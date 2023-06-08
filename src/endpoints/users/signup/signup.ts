import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import {INTERNAL_sendEmailVerificationCode} from '../sendEmailVerificationCode/handler';
import {SignupEndpoint} from './types';
import {INTERNAL_signupUser} from './utils';
import {signupJoiSchema} from './validation';

const signup: SignupEndpoint = async (context, instData) => {
  const data = validate(instData.data, signupJoiSchema);
  const user = await INTERNAL_signupUser(context, data);
  const [userToken, clientAssignedToken] = await executeWithMutationRunOptions(context, opts =>
    Promise.all([
      getUserToken(context, user.resourceId, opts),
      getUserClientAssignedToken(context, user.resourceId, opts),
    ])
  );
  instData.agent = makeUserSessionAgent(user, userToken);
  await INTERNAL_sendEmailVerificationCode(context, user);
  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default signup;
