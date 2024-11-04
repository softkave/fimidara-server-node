import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {PermissionDeniedError} from '../../users/errors.js';
import {encodeAgentToken} from '../utils.js';
import {RefreshAgentTokenEndpoint} from './types.js';
import {refreshAgentTokenJoiSchema} from './validation.js';

const refreshAgentTokenEndpoint: RefreshAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, refreshAgentTokenJoiSchema);

  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );

  const token = agent.agentToken;
  appAssert(token, new PermissionDeniedError());
  appAssert(
    reqData.incomingTokenData?.sub?.refreshToken,
    new PermissionDeniedError()
  );
  appAssert(
    await kUtilsInjectables
      .session()
      .verifyRefreshToken(
        data.refreshToken,
        reqData.incomingTokenData.sub.refreshToken
      ),
    new PermissionDeniedError('Invalid refresh token')
  );

  return await encodeAgentToken(token);
};

export default refreshAgentTokenEndpoint;
