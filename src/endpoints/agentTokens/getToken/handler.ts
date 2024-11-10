import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkAgentTokenAuthorization02, getPublicAgentToken} from '../utils.js';
import {GetAgentTokenEndpoint} from './types.js';
import {getAgentTokenJoiSchema} from './validation.js';

const getAgentTokenEndpoint: GetAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, getAgentTokenJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  let {token} = await checkAgentTokenAuthorization02(
    agent,
    workspaceId,
    data.tokenId,
    data.providedResourceId,
    kFimidaraPermissionActions.readAgentToken
  );

  appAssert(token.workspaceId);
  token = await populateAssignedTags(token.workspaceId, token);

  return {token: await getPublicAgentToken(token, data.shouldEncode ?? false)};
};

export default getAgentTokenEndpoint;
