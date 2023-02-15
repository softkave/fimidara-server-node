import {TokenAudience, TokenType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {assertIncomingToken} from '../../contexts/SessionContext';
import {changePasswordJoiSchema} from '../changePassword/validation';
import {completeChangePassword} from '../changePasswordWithCurrentPassword/handler';
import internalConfirmEmailAddress from '../confirmEmailAddress/internalConfirmEmailAddress';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import {userExtractor} from '../utils';
import {ChangePasswordWithTokenEndpoint} from './types';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, changePasswordJoiSchema);
  assertIncomingToken(instData.incomingTokenData, TokenType.UserToken);
  const userToken = await context.data.userToken.assertGetOneByQuery(
    // It's okay to disable this check because incomingTokenData
    // exists cause of the assertIncomingToken check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    UserTokenQueries.getById(instData.incomingTokenData!.sub.id)
  );

  if (
    !context.session.tokenContainsAudience(context, userToken, [
      TokenAudience.ChangePassword,
      TokenAudience.Login,
    ])
  ) {
    throw new InvalidCredentialsError();
  }

  if (!userToken.expires) {
    throw new InvalidCredentialsError();
  }

  if (Date.now() > userToken.expires) {
    throw new CredentialsExpiredError();
  }

  const user = await context.data.user.assertGetOneByQuery(UserQueries.getById(userToken.userId));

  // Make user available to changePassword endpoint called in completeChangePassword
  instData.user = user;
  const {result} = await completeChangePassword(context, instData, data.password);

  // Verify user email address since the only way to change password
  // with token is to use the link sent to the user email address
  result.user = userExtractor(await internalConfirmEmailAddress(context, result.user));
  return result;
};

export default changePasswordWithToken;
