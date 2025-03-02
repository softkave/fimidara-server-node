import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {checkWorkspaceAuthorization02} from '../utils.js';
import {DeleteWorkspaceEndpoint} from './types.js';
import {beginDeleteWorkspace} from './utils.js';
import {deleteWorkspaceJoiSchema} from './validation.js';

const deleteWorkspace: DeleteWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, deleteWorkspaceJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  const {workspace} = await checkWorkspaceAuthorization02(
    agent,
    kFimidaraPermissionActions.deleteWorkspace,
    data.workspaceId
  );

  const [job] = await beginDeleteWorkspace({
    agent,
    workspaceId: workspace.resourceId,
    resources: [workspace],
  });
  appAssert(job, 'Could not create delete workspace job');

  return {jobId: job.resourceId};
};

export default deleteWorkspace;
