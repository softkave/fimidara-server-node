import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {getAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {executeCascadeDelete} from '../../utils';
import {checkAgentTokenAuthorization02} from '../utils';
import {DeleteAgentTokenEndpoint} from './types';
import {deleteAgentTokenJoiSchema} from './validation';

const cascade: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: (context, id) => context.semantic.agentToken.deleteOneById(id),
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.PermissionItem]: async (context, id) => {
    await Promise.all([
      context.semantic.permissionItem.deleteManyByTargetId(id),
      context.semantic.permissionItem.deleteManyByEntityId(id),
    ]);
  },
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AssignedItem]: (context, id) =>
    context.semantic.assignedItem.deleteResourceAssignedItems(id),
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
};

const deleteAgentToken: DeleteAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getAgentTokenId(agent, data.tokenId, data.onReferenced);
  await checkAgentTokenAuthorization02(context, agent, tokenId, BasicCRUDActions.Delete);
  await executeCascadeDelete(context, tokenId, cascade);
};

export default deleteAgentToken;
