import {AppResourceTypeMap} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkCollaborationRequestAuthorization02} from '../utils';
import {DeleteCollaborationRequestEndpoint} from './types';
import {deleteCollaborationRequestJoiSchema} from './validation';

const deleteCollaborationRequest: DeleteCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    'deleteAgentToken'
  );
  const job = await enqueueDeleteResourceJob({
    type: AppResourceTypeMap.CollaborationRequest,
    args: {workspaceId: request.workspaceId, resourceId: request.resourceId},
  });
  return {jobId: job.resourceId};
};

export default deleteCollaborationRequest;
