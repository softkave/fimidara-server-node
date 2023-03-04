import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {executeCascadeDelete} from '../../utils';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {deleteTagJoiSchema} from './validation';

const cascade: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.AgentToken]: noopAsync,
  [AppResourceType.ClientAssignedToken]: noopAsync,
  [AppResourceType.UserToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.PermissionItem]: (context, id) =>
    context.semantic.permissionItem.deleteManyByTargetId(id),
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.Tag]: (context, id) => context.semantic.tag.deleteOneById(id),
  [AppResourceType.AssignedItem]: (context, id) =>
    context.semantic.assignedItem.deleteAssignedItemResources(id),
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
};

const deleteTag: DeleteTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {tag} = await checkTagAuthorization02(context, agent, data.tagId, BasicCRUDActions.Delete);
  await executeCascadeDelete(context, tag.resourceId, cascade);
};

export default deleteTag;
