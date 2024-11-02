import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getPermissionGroupsQuery} from '../getPermissionGroups/utils.js';
import {CountPermissionGroupsEndpoint} from './types.js';
import {countPermissionGroupsJoiSchema} from './validation.js';

const countPermissionGroupsEndpoint: CountPermissionGroupsEndpoint =
  async reqData => {
    const data = validate(reqData.data, countPermissionGroupsJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.readPermission,
    });

    const q = await getPermissionGroupsQuery(agent, workspace);
    const count = await kSemanticModels
      .permissionGroup()
      .countManyByWorkspaceAndIdList(q);

    return {count};
  };

export default countPermissionGroupsEndpoint;
