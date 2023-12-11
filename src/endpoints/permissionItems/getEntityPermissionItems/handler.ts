import {validate} from '../../../utils/validate';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {PermissionItemUtils} from '../utils';
import {GetEntityPermissionItemsEndpoint} from './types';
import {doAccessCheckForGetEntityPermissionItems} from './utils';
import {getEntityPermissionItemsJoiSchema} from './validation';

/**
 * TODO: Support returning a list of permissions an agent/entity can perform
 * TODO: Support returning all permission items belonging to an entity directly
 * or inherited
 */
const getEntityPermissionItems: GetEntityPermissionItemsEndpoint = async instData => {
  const data = validate(instData.data, getEntityPermissionItemsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await doAccessCheckForGetEntityPermissionItems(agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const items = await kSemanticModels
    .permissionItem()
    .getManyByQuery({entityId: data.entityId}, data);
  return {
    page: getEndpointPageFromInput(data),
    items: PermissionItemUtils.extractPublicPermissionItemList(items),
  };
};

export default getEntityPermissionItems;
