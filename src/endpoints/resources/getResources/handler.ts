import {kFimidaraResourceType} from '../../../definitions/system.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getPublicResourceList} from '../getPublicResource.js';
import {INTERNAL_getResources} from '../getResources.js';
import {GetResourcesEndpoint} from './types.js';
import {getResourcesJoiSchema} from './validation.js';

const kAllowedTypes = [
  kFimidaraResourceType.Workspace,
  kFimidaraResourceType.CollaborationRequest,
  kFimidaraResourceType.AgentToken,
  kFimidaraResourceType.PermissionGroup,
  kFimidaraResourceType.PermissionItem,
  kFimidaraResourceType.Folder,
  kFimidaraResourceType.File,
  kFimidaraResourceType.User,
  kFimidaraResourceType.Tag,
  kFimidaraResourceType.UsageRecord,
];

const getResources: GetResourcesEndpoint = async reqData => {
  const data = validate(reqData.data, getResourcesJoiSchema);
  const {agent, workspace, workspaceId} = await initEndpoint(reqData, {data});

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
