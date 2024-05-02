import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkCollaborationRequestAuthorization02} from '../utils.js';
import {DeleteCollaborationRequestEndpoint} from './types.js';
import {beginDeleteCollaborationRequest} from './utils.js';
import {deleteCollaborationRequestJoiSchema} from './validation.js';

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, deleteCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {request} = await checkCollaborationRequestAuthorization02(
    agent,
    data.requestId,
    kFimidaraPermissionActionsMap.deleteCollaborationRequest
  );

  const [job] = await beginDeleteCollaborationRequest({
    agent,
    workspaceId: request.workspaceId,
    resources: [request],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteCollaborationRequest;
