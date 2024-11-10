import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkAgentTokenAuthorization02,
  encodeAgentToken as encodePublicAgentToken,
} from '../utils.js';
import {EncodeAgentTokenEndpoint} from './types.js';
import {encodeAgentTokenJoiSchema} from './validation.js';

const encodeAgentTokenEndpoint: EncodeAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, encodeAgentTokenJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspaceId,
    data.tokenId,
    data.providedResourceId,
    kFimidaraPermissionActions.readAgentToken
  );

  return await encodePublicAgentToken(token);
};

export default encodeAgentTokenEndpoint;
