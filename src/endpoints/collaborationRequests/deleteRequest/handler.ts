import {kAppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteCollaborationRequestEndpoint} from './types';
import {deleteCollaborationRequestJoiSchema} from './validation';

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, deleteCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    agent,
    data.requestId,
    'deleteAgentToken'
  );
  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.CollaborationRequest,
    args: {workspaceId: request.workspaceId, resourceId: request.resourceId},
  });
  return {jobId: job.resourceId};
};

export default deleteCollaborationRequest;
