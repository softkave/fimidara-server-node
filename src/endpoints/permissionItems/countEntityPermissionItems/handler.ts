import {AppActionType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkPermissionEntitiesExist} from '../checkPermissionArtifacts';
import {getEntityPermissionItemsQuery} from '../getEntityPermissionItems/utils';
import {CountEntityPermissionItemsEndpoint} from './types';
import {countEntityPermissionItemsJoiSchema} from './validation';

const countEntityPermissionItems: CountEntityPermissionItemsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countEntityPermissionItemsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkPermissionEntitiesExist(
    context,
    agent,
    workspace.resourceId,
    [data.entityId],
    AppActionType.Read
  );
  await getEntityPermissionItemsQuery(context, agent, workspace, data);
  const count = await context.semantic.permissionItem.countByQuery({
    entityId: data.entityId,
  });
  return {count};
};

export default countEntityPermissionItems;
