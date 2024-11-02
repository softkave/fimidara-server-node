import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {permissionGroupListExtractor} from '../utils.js';
import {GetPermissionGroupsEndpoint} from './types.js';
import {getPermissionGroupsQuery} from './utils.js';
import {getPermissionGroupsJoiSchema} from './validation.js';

const getPermissionGroups: GetPermissionGroupsEndpoint = async reqData => {
  const data = validate(reqData.data, getPermissionGroupsJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {
    data,
    action: kFimidaraPermissionActions.readPermission,
  });

  const q = await getPermissionGroupsQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const items = await kSemanticModels
    .permissionGroup()
    .getManyByWorkspaceAndIdList(q, data);

  return {
    page: getEndpointPageFromInput(data),
    permissionGroups: permissionGroupListExtractor(items),
  };
};

export default getPermissionGroups;
