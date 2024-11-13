import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {permissionGroupExtractor} from '../utils.js';
import {AddPermissionGroupEndpoint, NewPermissionGroupInput} from './types.js';
import {addPermissionGroupJoiSchema} from './validation.js';

export async function createPermissionGroup(
  agent: SessionAgent,
  workspaceId: string,
  data: NewPermissionGroupInput,
  opts?: SemanticProviderMutationParams
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    await checkPermissionGroupNameExists(workspaceId, data.name, opts);

    const pg = newWorkspaceResource<PermissionGroup>(
      agent,
      kFimidaraResourceType.PermissionGroup,
      workspaceId,
      {...data, workspaceId}
    );

    await kSemanticModels.permissionGroup().insertItem(pg, opts);
    return pg;
  }, opts);
}

const addPermissionGroupEndpoint: AddPermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, addPermissionGroupJoiSchema);
    const {agent, getWorkspace} = await initEndpoint(reqData, {data});
    const workspace = await getWorkspace(
      kFimidaraPermissionActions.updatePermission
    );

    const pg = await createPermissionGroup(agent, workspace.resourceId, data);
    return {permissionGroup: permissionGroupExtractor(pg)};
  };

export default addPermissionGroupEndpoint;
