import argon2 from 'argon2';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kTokenAccessScope} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {validate} from '../../../utils/validate.js';
import {NotFoundError} from '../../errors.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {confirmEmailAddress} from '../confirmEmailAddress/handler.js';
import {
  CredentialsExpiredError,
  IncorrectPasswordError,
  InvalidCredentialsError,
} from '../errors.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {getUserFromSessionAgent} from '../utils/getUserFromSessionAgent.js';
import {ChangePasswordEndpoint} from './types.js';
import {changePasswordJoiSchema} from './validation.js';

async function changePassword(userId: string, props: {password: string}) {
  const hash = await argon2.hash(props.password);
  return await kSemanticModels.utils().withTxn(async opts => {
    const updatedUser = await kSemanticModels.user().getAndUpdateOneById(
      userId,
      /** update */ {
        hash,
        passwordLastChangedAt: getTimestamp(),
        requiresPasswordChange: false,
      },
      opts
    );
    assertUser(updatedUser);

    // soft delete existing user tokens cause they're no longer valid
    await kSemanticModels
      .agentToken()
      .softDeleteAgentTokens(updatedUser.resourceId, undefined, opts);

    return updatedUser;
  });
}

const changePasswordEndpoint: ChangePasswordEndpoint = async reqData => {
  const data = validate(reqData.data, changePasswordJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {
    tokenScope: [
      kTokenAccessScope.changePassword,
      kTokenAccessScope.login,
      kTokenAccessScope.access,
    ],
  });

  let user = await kSemanticModels.utils().withTxn(async opts => {
    return await getUserFromSessionAgent(
      agent,
      /** params */ {
        workspaceId,
        userId: data.userId,
        scope: [kTokenAccessScope.changePassword, kTokenAccessScope.login],
        action: kFimidaraPermissionActions.changePassword,
      },
      opts
    );
  });

  if (agent.agentToken.scope?.includes(kTokenAccessScope.login)) {
    appAssert(data.currentPassword, new InvalidCredentialsError());
    const passwordMatch = await argon2.verify(user.hash, data.currentPassword);

    appAssert(passwordMatch, new IncorrectPasswordError());
  }

  appAssert(agent.agentToken?.expiresAt, new InvalidCredentialsError());
  appAssert(
    Date.now() < agent.agentToken.expiresAt,
    new CredentialsExpiredError()
  );

  user = await changePassword(user.resourceId, data);

  // verify user email address since the only way to change password
  // with token is to use the link sent to the user email address
  if (user.email && !user.isEmailVerified) {
    user = await confirmEmailAddress(user.resourceId);
    appAssert(user, new NotFoundError('User not found'));
  }

  // delete user token and incomingTokenData since they are no longer valid
  reqData.agent = null;
  reqData.incomingTokenData = null;

  return await getLoginResult(user);
};

export default changePasswordEndpoint;
