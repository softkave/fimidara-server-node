import {AppActionType, AppResourceType} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenAuthorization02} from '../utils';
import {DeleteAgentTokenEndpoint} from './types';
import {deleteAgentTokenJoiSchema} from './validation';

export const DELETE_AGENT_TOKEN_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AgentToken]: (context, args, opts) =>
    context.semantic.agentToken.deleteOneById(args.resourceId, opts),
  [AppResourceType.PermissionItem]: async (context, args, opts) => {
    await Promise.all([
      context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
      context.semantic.permissionItem.deleteManyByEntityId(args.resourceId, opts),
    ]);
  },
  [AppResourceType.AssignedItem]: async (context, args, opts) =>
    context.semantic.assignedItem.deleteResourceAssignedItems(
      args.workspaceId,
      args.resourceId,
      undefined,
      opts
    ),
};

const deleteAgentToken: DeleteAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const {token} = await checkAgentTokenAuthorization02(
    context,
    agent,
    workspace.resourceId,
    tokenId,
    data.providedResourceId,
    AppActionType.Read
  );
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.AgentToken,
    args: {
      workspaceId: workspace.resourceId,
      resourceId: token.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteAgentToken;
