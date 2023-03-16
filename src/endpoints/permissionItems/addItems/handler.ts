import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {internalAddPermissionItems} from './utils';
import {addPermissionItemsJoiSchema} from './validation';

const addPermissionItems: AddPermissionItemsEndpoint = async (context, instData) => {
  const data = validate(instData.data, addPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = await getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    action: BasicCRUDActions.Create,
    targets: [{type: AppResourceType.PermissionItem}],
  });
  const permissionItems = await internalAddPermissionItems(context, agent, workspaceId, data);
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(permissionItems),
  };
};

export default addPermissionItems;
