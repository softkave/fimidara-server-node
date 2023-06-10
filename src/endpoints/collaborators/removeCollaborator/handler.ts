import {AppActionType, AppResourceType} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

const removeCollaborator: RemoveCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    workspaceId,
    data.collaboratorId,
    AppActionType.Delete
  );
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.User,
    args: {
      workspaceId,
      resourceId: collaborator.resourceId,
      userEmail: collaborator.email,
      agentTokenId: agent.agentTokenId,
    },
    isRemoveCollaborator: true,
  });
  return {jobId: job.resourceId};
};

export default removeCollaborator;
