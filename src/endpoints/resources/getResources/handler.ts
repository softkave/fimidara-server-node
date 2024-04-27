import {kFimidaraResourceType} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getPublicResourceList} from '../getPublicResource';
import {INTERNAL_getResources} from '../getResources';
import {GetResourcesEndpoint} from './types';
import {getResourcesJoiSchema} from './validation';

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

const getResources: GetResourcesEndpoint = async instData => {
  const data = validate(instData.data, getResourcesJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
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
