import {merge} from 'lodash';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {validate} from '../../../utilities/validate';
import {makeUserSessionAgent} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils';
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
  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  // Make the user token available to other requests
  // made with this request data
  instData.agent = makeUserSessionAgent(
    userToken,
    merge(user, {workspaces: []})
  );

  instData.pendingPromises.push({
    id: 'callComfirmEmail',
    promise: fireAndForgetPromise(callComfirmEmail(context, instData)),
  });

  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default signup;
