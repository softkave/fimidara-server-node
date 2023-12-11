import {AppResourceTypeMap} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getPublicResourceList} from '../getPublicResource';
import {INTERNAL_getResources} from '../getResources';
import {GetResourcesEndpoint} from './types';
import {getResourcesJoiSchema} from './validation';

const kAllowedTypes = [
  AppResourceTypeMap.Workspace,
  AppResourceTypeMap.CollaborationRequest,
  AppResourceTypeMap.AgentToken,
  AppResourceTypeMap.PermissionGroup,
  AppResourceTypeMap.PermissionItem,
  AppResourceTypeMap.Folder,
  AppResourceTypeMap.File,
  AppResourceTypeMap.User,
  AppResourceTypeMap.Tag,
  AppResourceTypeMap.UsageRecord,
];

const getResources: GetResourcesEndpoint = async instData => {
  const data = validate(instData.data, getResourcesJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(workspaceId);
  const resources = await INTERNAL_getResources({
    agent,
    allowedTypes: kAllowedTypes,
    workspaceId: workspace.resourceId,
    inputResources: data.resources,
    checkAuth: true,
    nothrowOnCheckError: true,
    fillAssignedItems: true,
    checkBelongsToWorkspace: !!data.workspaceId,
  });
  return {resources: getPublicResourceList(resources, workspaceId)};
};

export default getResources;
