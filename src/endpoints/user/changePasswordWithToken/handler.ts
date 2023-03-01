import {AppResourceType, TokenFor} from '../../../definitions/system';
import {assertIncomingToken} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {changePasswordJoiSchema} from '../changePassword/validation';
import {completeChangePassword} from '../changePasswordWithCurrentPassword/handler';
import internalConfirmEmailAddress from '../confirmEmailAddress/internalConfirmEmailAddress';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import {assertUserToken, userExtractor} from '../utils';
import {ChangePasswordWithTokenEndpoint} from './types';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, changePasswordJoiSchema);
  assertIncomingToken(instData.incomingTokenData, AppResourceType.UserToken);
  const userToken = await context.semantic.userToken.getOneById(
    // It's okay to disable this check because incomingTokenData exists cause of
    // the assertIncomingToken check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    instData.incomingTokenData!.sub.id
  );

  assertUserToken(userToken);
  const canChangePasswordWithToken = context.session.tokenContainsAudience(context, userToken, [
    TokenFor.ChangePassword,
    TokenFor.Login,
  ]);

  if (!canChangePasswordWithToken || !userToken.expires) {
    throw new InvalidCredentialsError();
  }
  if (Date.now() > userToken.expires) {
    throw new CredentialsExpiredError();
  }

  const result = await completeChangePassword(context, instData, data.password);

  // Verify user email address since the only way to change password
  // with token is to use the link sent to the user email address
  const user = await internalConfirmEmailAddress(context, result.user.resourceId);
  const completeUserData = await populateUserWorkspaces(context, user);
  result.user = userExtractor(completeUserData);
  return result;
};

export default changePasswordWithToken;
