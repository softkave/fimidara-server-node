import {ResourceWrapper, kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkResourcesBelongsToWorkspace} from '../../resources/containerCheckFns';
import {GetJobStatusEndpoint} from './types';
import {getJobStatusJoiSchema} from './validation';

const getJobStatus: GetJobStatusEndpoint = async instData => {
  const data = validate(instData.data, getJobStatusJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
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
