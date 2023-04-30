import {AppResourceType, ResourceWrapper} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {NotFoundError} from '../../errors';
import {checkResourcesBelongsToWorkspace} from '../../resources/containerCheckFns';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getJob} from '../runner';
import {GetJobStatusEndpoint} from './types';
import {getJobStatusJoiSchema} from './validation';

const getJobStatus: GetJobStatusEndpoint = async (context, instData) => {
  const data = validate(instData.data, getJobStatusJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  if (agent.user) agent.user = await populateUserWorkspaces(context, agent.user);

  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const resource: ResourceWrapper = {
    resourceId: agent.agentId,
    resource: (agent.user || agent.agentToken)!,
    resourceType: agent.user ? AppResourceType.User : AppResourceType.AgentToken,
  };
  checkResourcesBelongsToWorkspace(
    workspace.resourceId,
    [resource],
    () => new NotFoundError('Job not found.')
  );
  const job = await getJob(context, data.jobId);
  return {status: job.status};
};

export default getJobStatus;
