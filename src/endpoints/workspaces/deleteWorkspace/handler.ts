import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceAuthorization02} from '../utils';
import {DeleteWorkspaceEndpoint} from './types';
import {beginDeleteWorkspace} from './utils';
import {deleteWorkspaceJoiSchema} from './validation';

const deleteWorkspace: DeleteWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, deleteWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kAppResourceType.User);
  const {workspace} = await checkWorkspaceAuthorization02(
    agent,
    kPermissionsMap.deleteWorkspace,
    data.workspaceId
  );

  const [job] = await beginDeleteWorkspace({
    agent,
    workspaceId: workspace.resourceId,
    resources: [workspace],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteWorkspace;
