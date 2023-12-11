import {AppResourceTypeMap} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {enqueueDeleteResourceJob} from '../../jobs/utils';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {deleteWorkspaceJoiSchema} from './validation';

const deleteWorkspace: DeleteWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, AppResourceTypeMap.User);
  const {workspace} = await checkWorkspaceAuthorization02(
    agent,
    'deleteWorkspace',
    data.workspaceId
  );

  const job = await enqueueDeleteResourceJob({
    type: AppResourceTypeMap.Workspace,
    args: {workspaceId: workspace.resourceId, resourceId: workspace.resourceId},
  });

  return {jobId: job.resourceId};
};

export default deleteWorkspace;
