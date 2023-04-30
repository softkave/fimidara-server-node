import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import sendEmailVerificationCode from '../sendEmailVerificationCode/handler';
import {SignupEndpoint} from './types';
import {INTERNAL_signupUser} from './utils';
import {signupJoiSchema} from './validation';

async function callComfirmEmail(context: BaseContextType, reqData: RequestData) {
  const sendEmailReqData = RequestData.clone(reqData, reqData.data);
  const result = await sendEmailVerificationCode(context, sendEmailReqData);
  return {
    result,
    updatedReqData: RequestData.merge(sendEmailReqData, reqData),
  };
}

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
  await callComfirmEmail(context, instData);
  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default signup;
