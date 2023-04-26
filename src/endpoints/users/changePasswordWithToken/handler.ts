import assert from 'assert';
import {TokenAccessScope} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {assertAgentToken} from '../../agentTokens/utils';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {changePasswordJoiSchema} from '../changePassword/validation';
import {completeChangePassword} from '../changePasswordWithCurrentPassword/handler';
import internalConfirmEmailAddress from '../confirmEmailAddress/internalConfirmEmailAddress';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import {assertUser, userExtractor} from '../utils';
import {ChangePasswordWithTokenEndpoint} from './types';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, changePasswordJoiSchema);
  const userToken = await context.semantic.agentToken.getOneById(
    // It's okay to disable this check because incomingTokenData exists cause of
    // the assertIncomingToken check
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    instData.incomingTokenData!.sub.id
  );

  assertAgentToken(userToken);
  const canChangePasswordWithToken = context.session.tokenContainsScope(userToken, [
    TokenAccessScope.ChangePassword,
    TokenAccessScope.Login,
  ]);

  if (!canChangePasswordWithToken || !userToken.expires) throw new InvalidCredentialsError();
  if (Date.now() > userToken.expires) throw new CredentialsExpiredError();

  assert(userToken.separateEntityId);
  let user = await context.semantic.user.getOneById(userToken.separateEntityId);
  assertUser(user);
  const result = await completeChangePassword(context, instData, user, data.password);

  // Verify user email address since the only way to change password
  // with token is to use the link sent to the user email address
  user = await internalConfirmEmailAddress(context, result.user.resourceId);
  const completeUserData = await populateUserWorkspaces(context, user);
  result.user = userExtractor(completeUserData);
  return result;
};

export default changePasswordWithToken;
