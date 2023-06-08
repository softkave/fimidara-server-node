import {AppResourceType, ResourceWrapper} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {NotFoundError} from '../../errors';
import {checkResourcesBelongsToWorkspace} from '../../resources/containerCheckFns';
import {PermissionDeniedError} from '../../users/errors';
import {getJob} from '../runner';
import {GetJobStatusEndpoint} from './types';
import {getJobStatusJoiSchema} from './validation';

const getJobStatus: GetJobStatusEndpoint = async (context, instData) => {
  const data = validate(instData.data, getJobStatusJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  if (agent.user) agent.user = await populateUserWorkspaces(context, agent.user);

  const job = await getJob(context, data.jobId);
  appAssert(job.workspaceId, new PermissionDeniedError());
  const resource: ResourceWrapper = {
    resourceId: agent.agentId,
    resource: (agent.user || agent.agentToken)!,
    resourceType: agent.user ? AppResourceType.User : AppResourceType.AgentToken,
  };
  checkResourcesBelongsToWorkspace(
    job.workspaceId,
    [resource],
    () => new NotFoundError('Job not found.')
  );

  return {status: job.status};
};

export default getJobStatus;
