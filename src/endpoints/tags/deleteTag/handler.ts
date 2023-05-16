import {AppActionType, AppResourceType} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {enqueueDeleteResourceJob} from '../../jobs/runner';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {deleteTagJoiSchema} from './validation';

export const DELETE_TAG_CASCADE_FNS: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
  [AppResourceType.Job]: noopAsync,
  [AppResourceType.FilePresignedPath]: noopAsync,
  [AppResourceType.PermissionItem]: (context, args, opts) =>
    context.semantic.permissionItem.deleteManyByTargetId(args.resourceId, opts),
  [AppResourceType.Tag]: (context, args, opts) =>
    context.semantic.tag.deleteOneById(args.resourceId, opts),
  [AppResourceType.AssignedItem]: (context, args, opts) =>
    context.semantic.assignedItem.deleteWorkspaceAssignedItemResources(
      args.workspaceId,
      args.resourceId,
      opts
    ),
};

const deleteTag: DeleteTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {tag} = await checkTagAuthorization02(context, agent, data.tagId, AppActionType.Delete);
  const job = await enqueueDeleteResourceJob(context, {
    type: AppResourceType.Tag,
    args: {
      workspaceId: tag.workspaceId,
      resourceId: tag.resourceId,
    },
  });
  return {jobId: job.resourceId};
};

export default deleteTag;
