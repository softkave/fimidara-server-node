import {AppActionType, AppResourceType} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {PermissionItemUtils} from '../utils';
import {AddPermissionItemsEndpoint} from './types';
import {INTERNAL_addPermissionItems} from './utils';
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
    action: AppActionType.Create,
    targets: [{type: AppResourceType.PermissionItem}],
  });
  const permissionItems = await executeWithMutationRunOptions(
    context,
    async opts => await INTERNAL_addPermissionItems(context, agent, workspace, data, opts)
  );
  return {
    items: PermissionItemUtils.extractPublicPermissionItemList(permissionItems),
  };
};

export default addPermissionItems;
