import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPagedCollaboratorsWithoutPermission} from '../getCollaboratorsWithoutPermission/handler';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {CountCollaboratorsWithoutPermissionEndpoint} from './types';
import {countCollaboratorsWithoutPermissionJoiSchema} from './validation';

const countCollaboratorsWithoutPermission: CountCollaboratorsWithoutPermissionEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countCollaboratorsWithoutPermissionJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(context, agent, workspace);
  const collaboratorIdList = await getPagedCollaboratorsWithoutPermission(
    context,
    assignedItemsQuery
  );
  const count = collaboratorIdList.length;
  return {count};
};

export default countCollaboratorsWithoutPermission;
