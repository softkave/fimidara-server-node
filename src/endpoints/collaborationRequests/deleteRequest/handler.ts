import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkCollaborationRequestAuthorization02} from '../utils.js';
import {DeleteCollaborationRequestEndpoint} from './types.js';
import {beginDeleteCollaborationRequest} from './utils.js';
import {deleteCollaborationRequestJoiSchema} from './validation.js';

const deleteCollaborationRequestEndpoint: DeleteCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, deleteCollaborationRequestJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {request} = await checkCollaborationRequestAuthorization02({
      agent,
      workspaceId,
      requestId: data.requestId,
      action: kFimidaraPermissionActions.deleteCollaborationRequest,
    });

    const [job] = await beginDeleteCollaborationRequest({
      agent,
      workspaceId,
      resources: [request],
    });
    appAssert(job);

    return {jobId: job.resourceId};
  };

export default deleteCollaborationRequestEndpoint;
