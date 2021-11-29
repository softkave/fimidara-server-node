import {validate} from '../../../utilities/validate';
import {
  assertIncomingToken,
  TokenAudience,
  TokenType,
} from '../../contexts/SessionContext';
import {completeChangePassword} from '../changePasswordWithCurrentPassword/handler';
import {changePasswordWithPasswordJoiSchema} from '../changePasswordWithCurrentPassword/validation';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import UserQueries from '../UserQueries';
import UserTokenQueries from '../UserTokenQueries';
import {ChangePasswordWithTokenEndpoint} from './types';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, changePasswordWithPasswordJoiSchema);
  assertIncomingToken(instData.incomingTokenData, TokenType.UserToken);
  const userToken = await context.data.userToken.assertGetItem(
    // It's okay to disable this check because incomingTokenData
    // exists cause of the assertIncomingToken check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    UserTokenQueries.getById(instData.incomingTokenData!.sub.id)
  );

  if (
    !context.session.tokenContainsAudience(
      context,
      userToken,
      TokenAudience.ChangePassword
    )
  ) {
    throw new InvalidCredentialsError();
  }

  if (!userToken.expires) {
    throw new InvalidCredentialsError();
  }

  if (Date.now() > userToken.expires) {
    throw new CredentialsExpiredError();
  }

  const user = await context.data.user.assertGetItem(
    UserQueries.getById(userToken.userId)
  );

  // Allow other endpoints called with this request to use the fetched user data
  instData.user = user;
  const {result} = await completeChangePassword(
    context,
    instData,
    data.password
  );

  return result;
};

export default changePasswordWithToken;
