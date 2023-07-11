import {AppActionType, AppResourceType} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkWorkspaceExists} from '../../workspaces/utils';
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
    workspace,
    workspaceId: workspace.resourceId,
    action: AppActionType.Create,
    targets: {targetType: AppResourceType.PermissionItem},
  });
  await context.semantic.utils.withTxn(
    context,
    async opts => await INTERNAL_addPermissionItems(context, agent, workspace, data, opts)
  );
};

export default addPermissionItems;
