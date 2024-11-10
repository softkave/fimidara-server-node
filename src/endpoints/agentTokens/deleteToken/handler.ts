import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkAgentTokenAuthorization02} from '../utils.js';
import {DeleteAgentTokenEndpoint} from './types.js';
import {beginDeleteAgentToken} from './utils.js';
import {deleteAgentTokenJoiSchema} from './validation.js';

const deleteAgentTokenEndpoint: DeleteAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, deleteAgentTokenJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspaceId,
    data.tokenId,
    data.providedResourceId,
    kFimidaraPermissionActions.deleteAgentToken
  );

  const [job] = await beginDeleteAgentToken({
    agent,
    workspaceId,
    resources: [token],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteAgentTokenEndpoint;
