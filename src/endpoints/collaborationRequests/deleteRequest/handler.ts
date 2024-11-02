import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
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
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentType.api,
        kSessionUtils.accessScope.api
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
