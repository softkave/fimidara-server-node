import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {checkCollaborationRequestAuthorization02} from '../utils.js';
import {DeleteCollaborationRequestEndpoint} from './types.js';
import {beginDeleteCollaborationRequest} from './utils.js';
import {deleteCollaborationRequestJoiSchema} from './validation.js';

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, deleteCollaborationRequestJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {request} = await checkCollaborationRequestAuthorization02(
      agent,
      data.requestId,
      kFimidaraPermissionActions.deleteCollaborationRequest
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
