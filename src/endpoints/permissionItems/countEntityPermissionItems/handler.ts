import {validate} from '../../../utils/validate';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {doAccessCheckForGetEntityPermissionItems} from '../getEntityPermissionItems/utils';
import {CountEntityPermissionItemsEndpoint} from './types';
import {countEntityPermissionItemsJoiSchema} from './validation';

const countEntityPermissionItems: CountEntityPermissionItemsEndpoint = async instData => {
  const data = validate(instData.data, countEntityPermissionItemsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await doAccessCheckForGetEntityPermissionItems(agent, workspace, data);
  const count = await kSemanticModels.permissionItem().countByQuery({
    entityId: data.entityId,
  });
  return {count};
};

export default countEntityPermissionItems;
