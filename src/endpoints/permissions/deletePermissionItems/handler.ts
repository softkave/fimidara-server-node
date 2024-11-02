import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {DeletePermissionItemsEndpoint} from './types.js';
import {beginDeletePermissionItemByInput} from './utils.js';
import {deletePermissionItemsJoiSchema} from './validation.js';

const deletePermissionItemsEndpoint: DeletePermissionItemsEndpoint =
  async reqData => {
    const data = validate(reqData.data, deletePermissionItemsJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.updatePermission,
    });

    const jobs = await beginDeletePermissionItemByInput({
      agent,
      workspaceId,
      items: data.items,
    });

    return {jobIds: extractResourceIdList(jobs)};
  };

export default deletePermissionItemsEndpoint;
