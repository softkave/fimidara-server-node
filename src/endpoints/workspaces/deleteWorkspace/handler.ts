import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkWorkspaceAuthorization02} from '../utils.js';
import {DeleteWorkspaceEndpoint} from './types.js';
import {beginDeleteWorkspace} from './utils.js';
import {deleteWorkspaceJoiSchema} from './validation.js';

const deleteWorkspace: DeleteWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  const {workspace} = await checkWorkspaceAuthorization02(
    agent,
    kFimidaraPermissionActionsMap.deleteWorkspace,
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
