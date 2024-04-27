import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteCollaborationRequestEndpoint} from './types';
import {beginDeleteCollaborationRequest} from './utils';
import {deleteCollaborationRequestJoiSchema} from './validation';

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
