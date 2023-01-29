import {validate} from '../../../utils/validate';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {permissionGroupListExtractor} from '../utils';
import {GetEntityAssignedPermissionGroupsEndpoint} from './types';
import {getEntityAssignedPermissionGroupsJoiSchema} from './validation';

const getEntityAssignedPermissionGroups: GetEntityAssignedPermissionGroupsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getEntityAssignedPermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);

  return {page: getEndpointPageFromInput(data), permissionGroups: permissionGroupListExtractor([])};
};

export default getEntityAssignedPermissionGroups;
