import {AppResourceTypeMap} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {deleteWorkspaceJoiSchema} from './validation';

const deleteWorkspace: DeleteWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    AppResourceTypeMap.User
  );
  const {workspace} = await checkWorkspaceAuthorization02(
    context,
    agent,
    'deleteWorkspace',
    data.workspaceId
  );
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceTypeMap.Workspace,
    args: {
      workspaceId: workspace.resourceId,
      resourceId: workspace.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteWorkspace;
