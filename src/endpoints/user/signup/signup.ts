import {merge} from 'lodash';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {getUserClientAssignedToken, getUserToken, toLoginResult} from '../login/utils';
import sendEmailVerificationCode from '../sendEmailVerificationCode/handler';
import {SignupEndpoint} from './types';
import {internalSignupUser} from './utils';
import {signupJoiSchema} from './validation';

async function callComfirmEmail(context: IBaseContext, reqData: RequestData) {
  const sendEmailReqData = RequestData.clone(reqData, reqData.data);
  const result = await sendEmailVerificationCode(context, sendEmailReqData);
  return {
    result,
    updatedReqData: RequestData.merge(sendEmailReqData, reqData),
  };
}

const signup: SignupEndpoint = async (context, instData) => {
  const data = validate(instData.data, signupJoiSchema);
  const user = await internalSignupUser(context, data);
  const agent = makeUserSessionAgent(merge(user, {workspaces: []}));
  const userToken = await getUserToken(context, agent);
  const clientAssignedToken = await getUserClientAssignedToken(context, agent);

  // Make the user token available to other requests made with this request data
  instData.agent = agent;
  await callComfirmEmail(context, instData);
  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default signup;
