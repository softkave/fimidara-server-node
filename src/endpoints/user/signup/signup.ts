import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {EmailAddressNotAvailableError} from '../errors';
import {SignupEndpoint} from './types';
import {signupJoiSchema} from './validation';
import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import UserQueries from '../UserQueries';
import {makeUserSessionAgent} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import sendEmailVerificationCode from '../sendEmailVerificationCode/handler';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {
  getUserClientAssignedToken,
  getUserToken,
  toLoginResult,
} from '../login/utils';

/**
 * Requirements. Ensure that:
 * - Email address is not taken
 * - User account is created
 * - User token is created
 */

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
  const userExists = await context.data.user.checkItemExists(
    UserQueries.getByEmail(data.email)
  );

  if (userExists) {
    throw new EmailAddressNotAvailableError();
  }

  const hash = await argon2.hash(data.password);
  const now = getDateString();
  const user = await context.data.user.saveItem({
    hash,
    resourceId: getNewId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: now,
    passwordLastChangedAt: now,
    isEmailVerified: false,
    organizations: [],
  });

  const userToken = await getUserToken(context, user);
  const clientAssignedToken = await getUserClientAssignedToken(
    context,
    user.resourceId
  );

  // Make the user token available to other requests made with this request data
  instData.agent = makeUserSessionAgent(userToken, user);
  instData.works.push({
    id: 'callComfirmEmail',
    promise: fireAndForgetPromise(callComfirmEmail(context, instData)),
  });

  return toLoginResult(context, user, userToken, clientAssignedToken);
};

export default signup;
