import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {EmailAddressNotAvailableError} from '../errors';
import {SignupEndpoint} from './types';
import {signupJoiSchema} from './validation';
import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {userExtractor} from '../utils';
import UserQueries from '../UserQueries';
import {
  CURRENT_TOKEN_VERSION,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import sendEmailVerificationCode from '../sendEmailVerificationCode/handler';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';

async function callComfirmEmail(context: IBaseContext, reqData: RequestData) {
  const sendEmailReqData = RequestData.clone(reqData);
  const result = await sendEmailVerificationCode(context, sendEmailReqData);
  return {
    result,
    reqData: RequestData.merge(reqData, sendEmailReqData),
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
    userId: getNewId(),
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: now,
    passwordLastChangedAt: now,
    isEmailVerified: false,
    organizations: [],
  });

  const token = await context.data.userToken.saveItem({
    tokenId: getNewId(),
    userId: user.userId,
    audience: [TokenAudience.Login],
    issuedAt: getDateString(),
    version: CURRENT_TOKEN_VERSION,
  });

  // Make the user token available to other requests made with this request data
  instData.userToken = token;
  fireAndForgetPromise(callComfirmEmail(context, instData));
  return {
    user: userExtractor(user),
    token: context.session.encodeToken(
      context,
      token.tokenId,
      TokenType.UserToken
    ),
  };
};

export default signup;
