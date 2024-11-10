import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {DeleteWorkspaceEndpoint} from './types.js';
import {beginDeleteWorkspace} from './utils.js';
import {deleteWorkspaceJoiSchema} from './validation.js';

const deleteWorkspaceEndpoint: DeleteWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, deleteWorkspaceJoiSchema);
  const {agent, getWorkspace} = await initEndpoint(reqData, {data});
  const workspace = await getWorkspace(
    kFimidaraPermissionActions.deleteWorkspace
  );

  const [job] = await beginDeleteWorkspace({
    agent,
    workspaceId: workspace.resourceId,
    resources: [workspace],
  });

  appAssert(job, new ServerError(), 'Could not create delete workspace job');
  return {jobId: job.resourceId};
};

export default deleteWorkspaceEndpoint;
