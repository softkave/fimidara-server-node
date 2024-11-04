import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getPublicAgentToken} from '../utils.js';
import {AddAgentTokenEndpoint} from './types.js';
import {INTERNAL_createAgentToken} from './utils.js';
import {addAgentTokenJoiSchema} from './validation.js';

const addAgentTokenEndpoint: AddAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, addAgentTokenJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {
    data,
    action: kFimidaraPermissionActions.addAgentToken,
  });

  const token = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_createAgentToken(
      agent,
      workspace.resourceId,
      data,
      opts
    );
  });

  appAssert(token.workspaceId);
  return {token: await getPublicAgentToken(token, data.shouldEncode ?? false)};
};

export default addAgentTokenEndpoint;
