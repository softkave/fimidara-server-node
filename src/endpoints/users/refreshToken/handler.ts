import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {PermissionDeniedError} from '../errors.js';
import {getLoginResult} from '../login/utils.js';
import {assertUser} from '../utils.js';
import {RefreshUserTokenEndpoint} from './types.js';
import {refreshUserTokenJoiSchema} from './validation.js';

const refreshUserToken: RefreshUserTokenEndpoint = async reqData => {
  const data = validate(reqData.data, refreshUserTokenJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );

  appAssert(
    reqData.incomingTokenData?.sub?.refreshToken,
    new PermissionDeniedError()
  );
  appAssert(
    await kIjxUtils
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

export default refreshUserToken;
