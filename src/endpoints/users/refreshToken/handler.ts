import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {InvalidCredentialsError, PermissionDeniedError} from '../errors.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {RefreshUserTokenEndpoint} from './types.js';
import {refreshUserTokenJoiSchema} from './validation.js';

const refreshUserTokenEndpoint: RefreshUserTokenEndpoint = async reqData => {
  const data = validate(reqData.data, refreshUserTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.user,
      kSessionUtils.accessScope.user
    );

  appAssert(
    reqData.incomingTokenData?.sub?.refreshToken,
    new InvalidCredentialsError()
  );
  appAssert(
    await kUtilsInjectables
      .session()
      .verifyRefreshToken(
        data.refreshToken,
        reqData.incomingTokenData.sub.refreshToken
      ),
    new PermissionDeniedError()
  );

  assertUser(agent.user);
  return await getLoginResult(agent.user);
};

export default refreshUserTokenEndpoint;
