import {kAppResourceType, kTokenAccessScope} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kUtilsInjectables} from '../../contexts/injectables';
import INTERNAL_confirmEmailAddress from '../confirmEmailAddress/internalConfirmEmailAddress';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors';
import {assertUser, userExtractor} from '../utils';
import {ChangePasswordWithTokenEndpoint} from './types';
import {INTERNAL_changePassword} from './utils';
import {changePasswordWithTokenJoiSchema} from './validation';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint = async reqData => {
  const data = validate(reqData.data, changePasswordWithTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(reqData, [kAppResourceType.User], [kTokenAccessScope.ChangePassword]);

  if (!agent.agentToken?.expires) throw new InvalidCredentialsError();
  if (Date.now() > agent.agentToken.expires) throw new CredentialsExpiredError();

  let user = agent.user;
  assertUser(user);
  const result = await INTERNAL_changePassword(reqData, user.resourceId, data);

  // Verify user email address since the only way to change password
  // with token is to use the link sent to the user email address
  user = await INTERNAL_confirmEmailAddress(result.user.resourceId, null);
  appAssert(user);

  const completeUserData = await populateUserWorkspaces(user);
  result.user = userExtractor(completeUserData);
  return result;
};

export default changePasswordWithToken;
