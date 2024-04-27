import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {beginDeleteWorkspace} from './utils';
import {deleteWorkspaceJoiSchema} from './validation';

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
