import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {NotFoundError} from '../../errors.js';
import INTERNAL_confirmEmailAddress from '../confirmEmailAddress/internalConfirmEmailAddress.js';
import {CredentialsExpiredError, InvalidCredentialsError} from '../errors.js';
import {assertUser, userExtractor} from '../utils.js';
import {ChangePasswordWithTokenEndpoint} from './types.js';
import {INTERNAL_changePassword} from './utils.js';
import {changePasswordWithTokenJoiSchema} from './validation.js';

const changePasswordWithToken: ChangePasswordWithTokenEndpoint =
  async reqData => {
    const data = validate(reqData.data, changePasswordWithTokenJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.user,
        kSessionUtils.accessScopes.changePassword
      );

    if (!agent.agentToken?.expiresAt) throw new InvalidCredentialsError();
    if (Date.now() > agent.agentToken.expiresAt)
      throw new CredentialsExpiredError();

    let user = agent.user;
    assertUser(user);
    const result = await INTERNAL_changePassword(
      reqData,
      user.resourceId,
      data
    );

    // Verify user email address since the only way to change password
    // with token is to use the link sent to the user email address
    user = await INTERNAL_confirmEmailAddress(result.user.resourceId, null);
    appAssert(user, new NotFoundError('User not found'));

    const completeUserData = await populateUserWorkspaces(user);
    result.user = userExtractor(completeUserData);
    return result;
  };

export default changePasswordWithToken;
