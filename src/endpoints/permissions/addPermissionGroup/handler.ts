import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkPermissionGroupNameExists} from '../checkPermissionGroupNameExists.js';
import {permissionGroupExtractor} from '../utils.js';
import {AddPermissionGroupEndpoint} from './types.js';
import {addPermissionGroupJoiSchema} from './validation.js';

const addPermissionGroupEndpoint: AddPermissionGroupEndpoint =
  async reqData => {
    const data = validate(reqData.data, addPermissionGroupJoiSchema);
    const {agent, getWorkspace} = await initEndpoint(reqData, {data});
    const workspace = await getWorkspace(
      kFimidaraPermissionActions.updatePermission
    );

    const pg = await kSemanticModels.utils().withTxn(async opts => {
      await checkPermissionGroupNameExists(
        workspace.resourceId,
        data.name,
        opts
      );

      const pg = newWorkspaceResource<PermissionGroup>(
        agent,
        kFimidaraResourceType.PermissionGroup,
        workspace.resourceId,
        {...data, workspaceId: workspace.resourceId}
      );

      await kSemanticModels.permissionGroup().insertItem(pg, opts);
      return pg;
    });

    return {permissionGroup: permissionGroupExtractor(pg)};
  };

export default addPermissionGroupEndpoint;
