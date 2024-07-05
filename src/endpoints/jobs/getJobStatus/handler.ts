import {
  ResourceWrapper,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {checkResourcesBelongsToWorkspace} from '../../resources/containerCheckFns.js';
import {GetJobStatusEndpoint} from './types.js';
import {getJobStatusJoiSchema} from './validation.js';

const getJobStatus: GetJobStatusEndpoint = async reqData => {
  const data = validate(reqData.data, getJobStatusJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  if (agent.user) {
    agent.user = await populateUserWorkspaces(agent.user);
  }

  const job = await kSemanticModels.job().getOneById(data.jobId);
  appAssert(job, kReuseableErrors.job.notFound());
  appAssert(
    job.workspaceId,
    kReuseableErrors.job.notFound(),
    'Attempt to retrieve an internal job'
  );

  const resource: ResourceWrapper = {
    resourceId: agent.agentId,
    resource: (agent.user || agent.agentToken)!,
    resourceType: agent.user
      ? kFimidaraResourceType.User
      : kFimidaraResourceType.AgentToken,
  };
  checkResourcesBelongsToWorkspace(job.workspaceId, [resource], () =>
    kReuseableErrors.job.notFound()
  );

  return {status: job.status};
};

export default getJobStatus;
