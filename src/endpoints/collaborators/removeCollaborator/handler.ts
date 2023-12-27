import {kAppResourceType} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

const removeCollaborator: RemoveCollaboratorEndpoint = async instData => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    agent,
    workspaceId,
    data.collaboratorId,
    'removeCollaborator'
  );
  const job = await enqueueDeleteResourceJob({
    type: kAppResourceType.User,
    args: {workspaceId, resourceId: collaborator.resourceId},
    isRemoveCollaborator: true,
  });
  return {jobId: job.resourceId};
};

export default removeCollaborator;
