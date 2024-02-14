import {kPermissionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteCollaborationRequestEndpoint} from './types';
import {beginDeleteCollaborationRequest} from './utils';
import {deleteCollaborationRequestJoiSchema} from './validation';

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, deleteCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    agent,
    data.requestId,
    kPermissionsMap.deleteCollaborationRequest
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
